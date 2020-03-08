FROM node:12-alpine

LABEL name "Giveaway Bot"
LABEL version "1.0.4"
LABEL maintainer "Carter Himmel <fyko@sycer.dev>"
EXPOSE 5505

WORKDIR /usr/giveaways

COPY package.json pnpm-lock.yaml ./

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm i \
&& apk del .build-deps

COPY . .

ENV ID= \
	DISCORD_TOKEN= \
	OWNERS= \
	COLOR= \
	PREFIX= \
	MONGO= \
	CMDLOGID= \
	CMDLOGTOKEN= \
	DBL_TOKEN= \
	DBL_SIGNATURE= \
	VOTE_ID= \
	VOTE_TOKEN= \
	LOG_ID= \
	LOG_TOKEN= \
	API_PORT=
RUN pnpm run build
CMD ["node", "."]

