import DashClient from './GiveawayClient';
import { Collection } from 'discord.js';
import { connect, Model } from 'mongoose';
import ChildModel, { Child } from '../models/Child';
import GiveawayModel, { Giveaway } from '../models/Giveaway';
import GuildModel, { Guild } from '../models/Guild';

import { Logger } from 'winston';

let i = 0;

const MODELS = {
	child: ChildModel,
	giveaway: GiveawayModel,
	guild: GuildModel,
};

export default class SettingsProvider {
	public client: DashClient;

	public child: Collection<string, Child>;
	public giveaway: Collection<string, Giveaway>;
	public guild: Collection<string, Guild>;

	public ChildModel: Model<Child>;
	public GiveawayModel: Model<Giveaway>;
	public GuildModel: Model<Guild>;

	public constructor(client: DashClient) {
		/* our cient model */
		this.client = client;

		/* our document collections */
		this.child = new Collection();
		this.giveaway = new Collection();
		this.guild = new Collection();

		/* our models */
		this.ChildModel = ChildModel;
		this.GiveawayModel = GiveawayModel;
		this.GuildModel = GuildModel;
	}

	/* creates new model with provided data */
	public async new(type: 'child' | 'giveaway' | 'guild', data: object): Promise<Child | Giveaway | Guild | null> {
		const model = MODELS[type];
		const doc = new model(data);
		this[type].set(doc.id, doc as any);
		// @ts-ignore
		await doc.save();
		this.client.logger.info(`[DATABASE] Made new ${model.modelName} document with ID of ${doc._id}.`);
		return doc;
	}

	/* setting options of an existing document */
	public async set(
		type: 'child' | 'giveaway' | 'guild',
		data: object,
		key: object,
	): Promise<Child | Giveaway | Guild | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndUpdate(data, { $set: key }, { new: true });
		if (!doc) return null;
		this.client.logger.info(`[DATABASE] Edited ${model.modelName} document with ID of ${doc._id}.`);
		this[type].set(doc.id, doc as any);
		return doc;
	}

	/* removes a document with the provider query */
	public async remove(type: 'child' | 'giveaway' | 'guild', data: any): Promise<Child | Giveaway | Guild | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndDelete(data);
		if (!doc) return null;
		this.client.logger.info(`[DATABASE] Dleted ${model.modelName} document with ID of ${doc._id}.`);
		this.cacheAll();
		return doc;
	}

	public async cacheChildren(): Promise<Logger> {
		const items = await this.ChildModel.find();
		for (const i of items) this.child.set(i.id, i);
		i += items.length;
		return this.client.logger.info(`[DATABASE] Successfully cached ${items.length} Child documents.`);
	}

	public async cacheGiveaways(): Promise<Logger> {
		const items = await this.GiveawayModel.find();
		for (const i of items) this.giveaway.set(i.id, i);
		i += items.length;
		return this.client.logger.info(`[DATABASE] Successfully cached ${items.length} Giveaway documents.`);
	}

	public async cacheGuilds(): Promise<Logger> {
		const items = await this.GuildModel.find();
		for (const i of items) this.guild.set(i.id, i);
		i += items.length;
		return this.client.logger.info(`[DATABASE] Successfully cached ${items.length} Guild documents.`);
	}

	/* caching documents */
	public async cacheAll(): Promise<number> {
		await this.cacheChildren();
		await this.cacheGiveaways();
		await this.cacheGuilds();
		return i;
	}

	/* connecting */
	private async _connect(url: undefined | string): Promise<Logger | number> {
		if (url) {
			const start = Date.now();
			try {
				await connect(url, {
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false,
				});
			} catch (err) {
				this.client.logger.error(`[DATABASE] Error when connecting to MongoDB:\n${err.stack}`);
				process.exit(1);
			}
			return this.client.logger.info(`[DATABASE] Connected to MongoDB in ${Date.now() - start}ms.`);
		}
		this.client.logger.error('[DATABASE] No MongoDB url provided!');
		return process.exit(1);
	}

	public async init(): Promise<Logger> {
		await this._connect(process.env.MONGO);
		await this.cacheAll();
		return this.client.logger.info(`[DATABASE] [LAUNCHED] Successfully connected and cached ${i} documents.`);
	}
}
