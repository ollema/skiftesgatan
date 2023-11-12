####################################################################################################
# base image
####################################################################################################
FROM node:20-alpine AS base
RUN corepack enable

# set environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV TZ="Europe/Stockholm"

# set timezone
RUN apk --no-cache add tzdata
RUN cp /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone

# copy app and set working directory
COPY . /app
WORKDIR /app

####################################################################################################
# install dependencies
####################################################################################################
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

####################################################################################################
# build app
####################################################################################################
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm svelte-kit sync
RUN pnpm build

####################################################################################################
# final image
####################################################################################################
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

# set port
ENV PORT=3000
EXPOSE ${PORT}

# set user and environment
USER node
ENV NODE_ENV=production

# add tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD [ "node", "build" ]
