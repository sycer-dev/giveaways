# giveaway bot
giveaway bot but written with scalability and not caching literally everything in mind :^)

> template content:
# spec-tacles bot template

## What is spec-tacles (spec)?
>  Spectacles is a collection of applications and libraries designed to help you make stable, microservice-oriented Discord bots.

For more information, check out the [Spec-tacles Spec. Sheet](https://github.com/spec-tacles/spec)

### The gist of ot (tl;dr)
A `gateway` container pipes all events into RabbitMQ. You can then connect to the RabbitMQ instance and subscribe to any events you specified in the gateway.toml file (including READY). You can write workers that ingest specified events and handle them accordingly. For example, my [reaction roles bot](https://github.com/sycer-dev/reaction-roles/tree/next) v2 will have one service for commands, one service for reactions, another for guild-related events and a final one for misc. data.  
Example file structure:

```fix
docker
	gateway # the spec gateway
		Dockerfile
		gateway.toml
	services
		api
		workers
			guilds
			messages
			other
			reactions
services
	api # graphql api
	workers
			guilds
			messages
			other
			reactions
```

## Using this template
1) rename `_gateway.toml` in docker/gateway to `gateway.toml` and enter the bot token, whichever events you'd like & the respective [gateway intents](https://discord.com/developers/docs/topics/gateway#gateway-intents)
2) rename `_.env` to `.env` and fill in the respective values
3) run `docker-compose up` to start the bot - add the `-d` flag to run the service detached (in the background) and/or add the `--build` flag to rebuild after updating the codebase

## Thank You's
* This template utilizes the [spec-tacles](https://github.com/spec-tacles) procol primarily developed and maintained by [appellation](https://github.com/appellation). Thank you.
* This template also utilizes various typings and utilities from the [Klasa](https://github.com/dirigeants/klasa/) project devloped and maintained by the [Dirigeants team](https://github.com/orgs/dirigeants/people). Thank you.
* The command and listener framework is heavily inspired by [Discord-Akairo](https://github.com/discord-akairo/discord-akairo) primarily developed and maintained by [1Computer](https://github.com/1Computer1). Thank you.
* [Yukikaze](https://github.com/Naval-Base/yukikaze/), primarily developed and maintained by [iCrawl](https://github.com/iCrawl) and [appellation](https://github.com/appellation) has been a huge inspiration for this template. Thank you.

