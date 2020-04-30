import express, { Application, Request, Response } from 'express';
import GiveawayClient from '../client/GiveawayClient';
import helmet from 'helmet';
import parser from 'body-parser';
import DBL from '../util/dbl';

export default class API {
	public app: Application = express();
	protected readonly client: GiveawayClient;
	public readonly dbl: DBL;
	protected readonly port: number = Number(process.env.API_PORT!);

	public constructor(client: GiveawayClient) {
		this.client = client;
		this.dbl = new DBL(client);
	}

	private _sendMetrics(_: Request, res: Response): Response {
		res.setHeader('Content-Type', this.client.prometheus.metrics.register.contentType);
		return res.status(200).send(this.client.prometheus.metrics.register.metrics());
	}

	private _initMiddleware(): this {
		this.app
			.use(helmet())
			.use(parser.json())
			.use(parser.urlencoded({ extended: true }));
		return this;
	}

	private _initRoutes(): this {
		this.app.post('/vote', req => this.dbl._handleVote(req));
		this.app.get('/metrics', (req, res) => this._sendMetrics(req, res));
		return this;
	}

	private async _listen(): Promise<number> {
		await new Promise((resolve: () => void) => {
			this.app.listen(this.port, resolve);
		});
		this.client.logger.info(`[API]: API is live on port ${this.port}.`);
		return this.port;
	}

	private _setup(): this {
		this._initMiddleware();
		this._initRoutes();
		return this;
	}

	public async init(): Promise<this> {
		this.client.logger.debug(`[API]: Starting Giveaway API...`);
		this._setup();
		await this._listen();
		return this;
	}
}
