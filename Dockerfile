# use node 20 as base image
FROM node:20-bullseye

# set working directory
WORKDIR /usr/src/app

# set environment variables
ENV PNPM_HOME=/usr/local/.pnpm-store
ENV PATH=$PNPM_HOME/bin:$PATH

# install pnpm
ENV PNPM_VERSION=8
RUN npm install -g pnpm@${PNPM_VERSION}

# copy pnpm lock files
COPY pnpm-lock.yaml ./

# fetch dependencies
RUN pnpm fetch

# copy source code
COPY . ./

# install dependencies
RUN pnpm install --offline

# build app
RUN pnpm svelte-kit sync
RUN pnpm build

# add tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

# set port
ENV PORT=3000
EXPOSE ${PORT}

# set user and environment
USER node
ENV NODE_ENV=production

ENTRYPOINT ["/tini", "--"]
CMD [ "node", "build" ]
