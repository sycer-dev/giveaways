import 'reflect-metadata';

import { ApolloServer } from 'apollo-server-express';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { CreateResolver, GetResolver, DeleteResolver } from './resolvers/GuildResolver';

async function run() {
	await createConnection();

	const schema = await buildSchema({
		resolvers: [CreateResolver, GetResolver, DeleteResolver],
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