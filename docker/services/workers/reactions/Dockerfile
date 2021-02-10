FROM golang:1.15.8-alpine


WORKDIR /usr/src/reactionroles-next/worker/reactions 

COPY services/worker/reactions/. .

RUN go mod download

RUN go build -o reactions .

CMD ["./reactions"]

