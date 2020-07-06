FROM node:12-alpine

WORKDIR /usr/src/reactionroles-next/bot

COPY services/bot/. .

ENV PNPM_VERSION=5.1.4

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm config set store-dir ~/.pnpm-store \
&& pnpm install --frozen-lockfile
# && apk del .build-deps

# COPY . .

ENV DISCORD_TOKEN= 

RUN pnpm run build

CMD ["node", "."]

