FROM node:12-alpine

LABEL name "Giveaway Bot"
LABEL version "1.0.3"
LABEL maintainer "Carter Himmel <fyko@sycer.dev>"
WORKDIR /usr/giveaways
COPY package.json yarn.lock .yarnclean ./
RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& yarn install --ignore-engines \
&& apk del .build-deps
COPY . .
RUN yarn build
EXPOSE 5329
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
	LOG_TOKEN=
CMD ["node", "."]

