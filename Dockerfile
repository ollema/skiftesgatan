####################################################################################################
# base image
####################################################################################################
FROM node:20-alpine AS base
RUN corepack enable

# set environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# set timezone and ca-certificates
ENV TZ="Europe/Stockholm"
RUN apk update && apk --no-cache add tzdata ca-certificates
RUN cp /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone

# copy app and set working directory
COPY . /app
WORKDIR /app

# set environment variables
ARG PUBLIC_DSN
ENV PUBLIC_DSN=${PUBLIC_DSN}
ENV PUBLIC_NGROK_REDIRECT_URL=""

####################################################################################################
# production dependencies
####################################################################################################
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

####################################################################################################
# production build
####################################################################################################
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm svelte-kit sync
RUN PUBLIC_ADAPTER=node pnpm build

####################################################################################################
# final image
####################################################################################################
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build-node /app/build-node

# add tini
RUN apk update && apk add --no-cache tini

# set port
ENV PORT=3000
EXPOSE ${PORT}

# set user and environment
USER node
ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "build-node" ]
