import express, { Application, Request, Response } from 'express';
import GiveawayClient from '../client/GiveawayClient';
import helmet from 'helmet';
import parser from 'body-parser';

import DBL from '../util/dbl';

export default class API {
	public app: Application = express();

	public readonly dbl: DBL;

	protected readonly client: GiveawayClient;

	public constructor(client: GiveawayClient) {
		this.client = client;
		this.dbl = new DBL(client, process.env.DBL_TOKEN!, process.env.DBL_SIGNATURE!);
	}

	private _sendMetrics(_: Request, res: Response): Response {
		res.setHeader('Content-Type', this.client.prometheus.register.contentType);
		return res.status(200).send(this.client.prometheus.register.metrics());
	}

	private _initMiddleware(): this {
		this.app
			.use(helmet())
			.use(parser.json())
			.use(parser.urlencoded({ extended: true }));
		return this;
	}

	public init() {
		this._initMiddleware();
		this.app.post('/vote', this.dbl._handleVote.bind(this));
		this.app.get('/metrics', this._sendMetrics.bind(this));
		this.app.listen(process.env.API_PORT, () =>
			this.client.logger.info(`[API]: API is live on port ${process.env.API_PORT}`),
		);
	}
}
