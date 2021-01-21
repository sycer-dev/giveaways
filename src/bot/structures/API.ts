import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import GiveawayClient from '../client/GiveawayClient';
import helmet from 'fastify-helmet';
import DBL from '../util/dbl';

export default class API {
	public readonly dbl: DBL;
	protected readonly port: number = Number(process.env.API_PORT!);
	public readonly server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify();

	public constructor(protected readonly client: GiveawayClient) {
		this.dbl = new DBL(client);

		this.server.register(helmet);
	}

	public init() {
		this.client.logger.debug(`[API]: Starting Giveaway API...`);

		this.server.get('/metrics', async (_, reply) => {
			const data = await this.client.prometheus.metrics.register.metrics();
			void reply.type('text/plain').send(data);
		});

		this.server.post('/vote', (req) => this.dbl._handleVote(req));

		void this._listen();
	}

	private async _listen(): Promise<number> {
		await new Promise((resolve) => {
			this.server.listen(this.port, resolve);
		});
		this.client.logger.info(`[API]: API is live on port ${this.port}.`);
		return this.port;
	}
}
