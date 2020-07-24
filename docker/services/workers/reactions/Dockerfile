FROM golang:1.13.0-alpine


WORKDIR /usr/src/reactionroles-next/worker/reactions 

COPY services/worker/reactions/. .

RUN go mod download

RUN go build -o reactions .

CMD ["./reactions"]

