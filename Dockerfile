####################################################################################################
# pocketbase downloader
####################################################################################################
FROM alpine:latest as pocketbase-downloader

# set pocketbase version
ARG PB_VERSION=0.21.1

# install unzip and ca-certificates
RUN apk add --no-cache \
  unzip \
  ca-certificates

# download pocketbase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

####################################################################################################
# sveltekit build image
####################################################################################################
FROM node:20-alpine AS sveltekit-build
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

# set environment variables
# (is not used in prod but needs to be set for build to work)
ENV PUBLIC_NGROK_REDIRECT_URL=""

# build sveltekit app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm svelte-kit sync
RUN pnpm build

####################################################################################################
# final image
####################################################################################################
FROM alpine:latest

# set working directory
WORKDIR /pb

# install ca-certificates
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

# copy pocketbase
COPY --from=pocketbase-downloader /pb/pocketbase /pb/pocketbase

# copy sveltekit build
COPY --from=sveltekit-build /app/pb_public /pb/pb_public

# expose ports
EXPOSE 8080

# run pocketbase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
