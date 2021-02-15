FROM node:14-alpine

LABEL name "Giveaway Bot"
LABEL version "1.1.0"
LABEL maintainer "Carter Himmel <fyko@sycer.dev>"
EXPOSE 5501

WORKDIR /usr/giveaways

COPY package.json package-lock.json ./

RUN apk add --update
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache --virtual .build-deps git curl build-base python g++ make libtool autoconf automake
RUN npm install
RUN apk del .build-deps

COPY . .

RUN npm run build
RUN npm prune --production
CMD ["node", "."]

