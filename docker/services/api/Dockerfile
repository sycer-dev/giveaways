FROM node:12-alpine

WORKDIR /usr/src/giveaways/api

COPY services/api/. .

ENV PNPM_VERSION=5.1.4

EXPOSE 4000

RUN apk add --update \
&& apk add ca-certificates \
&& apk add --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm config set store-dir ~/.pnpm-store \
&& pnpm install --frozen-lockfile
# && apk del .build-deps

RUN pnpm run build

CMD ["node", "."]

