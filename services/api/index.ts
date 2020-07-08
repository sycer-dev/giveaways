import 'reflect-metadata';

import { ApolloServer } from 'apollo-server-express';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { CreateGuildResolver, GetGuildResolver, DeleteGuildResolver } from './resolvers/guild';
import { CreateGiveawayResolver, GetGiveawayResolver, DeleteGiveawayResolver } from './resolvers/giveaway';
import { CreateEntryResolver, GetEntryResolver, DeleteEntryResolver } from './resolvers/entry';

async function run() {
	await createConnection();

	const schema = await buildSchema({
		resolvers: [
			CreateGuildResolver,
			GetGuildResolver,
			DeleteGuildResolver,
			CreateGiveawayResolver,
			GetGiveawayResolver,
			DeleteGiveawayResolver,
			CreateEntryResolver,
			GetEntryResolver,
			DeleteEntryResolver,
		],
	});

	const apolloServer = new ApolloServer({
		schema,
	});

	const app = express()
		.use(helmet())
		.use(compression());

	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('server started on http://localhost:4000/graphql');
	});
}

run();
