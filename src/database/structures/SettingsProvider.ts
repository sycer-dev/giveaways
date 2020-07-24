import GiveawayClient from '../../bot/client/GiveawayClient';
import { Giveaway, Guild } from '../entities';
import { Connection, createConnection } from 'typeorm';

export default class SettingsProvider {
	public connection!: Connection;

	public readonly models = {
		giveaway: Giveaway,
		guild: Guild,
	};

	public constructor(protected readonly client: GiveawayClient) {}

	private async _connect() {
		const start = Date.now();
		try {
			this.connection = await createConnection({
				type: 'postgres',
				url: process.env.POSTGRES_URL,
				cache: {
					type: 'ioredis',
					options: process.env.REDIS_URL!,
					duration: 60 * 1000,
				},
			});
		} catch (err) {
			this.client.logger.error(`[DATABASE] Error when connecting to Postgres:\n${err.stack}`);
			process.exit(1);
		}
		return this.client.logger.verbose(`[DATABASE] Connected to Postgres in ${Date.now() - start}ms.`);
	}

	public async guild(id: string): Promise<Guild | null> {
		const row = await Guild.findOne(id);
		return row ?? null;
	}

	public async init(): Promise<this> {
		await this._connect();

		return this;
	}
}
