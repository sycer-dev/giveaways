import { Collection } from 'discord.js';
import { connect, Model, connection, Connection } from 'mongoose';
import ChildModel, { Child } from '../models/Child';
import GiveawayModel, { Giveaway } from '../models/Giveaway';
import GuildModel, { Guild } from '../models/Guild';
import { Logger } from 'winston';
import { MONGO_EVENTS } from '../util/Constants';
import GiveawayClient from './GiveawayClient';

let i = 0;

export interface Models {
	[key: string]: Model<any>;
}
export type Types = 'child' | 'giveaway' | 'guild';
export type ModelTypes = Child | Giveaway | Guild;

const MODELS = {
	child: ChildModel,
	giveaway: GiveawayModel,
	guild: GuildModel,
};

/**
 * The Settings Provider that handles all database reads and rights.
 */
export default class SettingsProvider {
	public client: GiveawayClient;

	public child: Collection<string, Child>;
	public giveaway: Collection<string, Giveaway>;
	public guild: Collection<string, Guild>;

	public ChildModel: Model<Child>;
	public GiveawayModel: Model<Giveaway>;
	public GuildModel: Model<Guild>;
	/**
	 *
	 * @param {SapotoClient} client - The extended Akairo Client
	 */
	public constructor(client: GiveawayClient) {
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

	/**
	 * Creates a new database document with the provided collection name and data.
	 * @param {Types} type - The collection name
	 * @param {object} data - The data for the new document
	 */
	public async new(type: Types, data: object): Promise<ModelTypes> {
		const model = MODELS[type];
		const doc = new model(data);
		this[type].set(doc.id, doc as any);
		// @ts-ignore
		await doc.save();
		this.client.logger.verbose(`[DATABASE] Made new ${model.modelName} document with ID of ${doc._id}.`);
		return doc;
	}

	/**
	 * Updates the a database document's data.
	 * @param {Types} type - The collection name
	 * @param {object} key - The search paramaters for the document
	 * @param {object} data - The data you wish to overwrite in the update
	 */
	public async set(type: Types, key: object, data: object): Promise<ModelTypes | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndUpdate(key, { $set: data }, { new: true });
		if (!doc) return null;
		this.client.logger.verbose(`[DATABASE] Edited ${model.modelName} document with ID of ${doc._id}.`);
		this[type].set(doc.id, doc as any);
		return doc;
	}

	/**
	 * Removes a database document.
	 * @param {Types} type - The collection name
	 * @param {object} data - The search paramaters for the document
	 * @returns {Promise<ModelTypes | null>} The document that was removed, if any.
	 */
	public async remove(type: Types, data: any): Promise<ModelTypes | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndDelete(data);
		if (!doc) return null;
		this[type].delete(doc.id);
		this.client.logger.verbose(`[DATABASE] Deleted ${model.modelName} document with ID of ${doc._id}.`);
		return doc;
	}

	/**
	 * Caching all database documents.
	 * @returns {number} The amount of documents cached total.
	 */
	private async _cacheAll(): Promise<number> {
		const map = Object.entries(MODELS);
		for (const [type, model] of map) await this._cache(type as any, model);
		return i;
	}

	/**
	 * Caching each collection's documents.
	 * @param {Types} type - The collection name
	 * @param {Model<any>} model - The model (collection) that's being cached
	 * @returns {number} The amount of documents cached from that collection.
	 */
	private async _cache(type: Types, model: Model<any>): Promise<any> {
		const collection = this[type];
		const items = await model.find();
		for (const i of items) collection.set(i.id, i);
		return (i += items.length);
	}

	/**
	 * Connect to the database
	 * @param {string} url - the mongodb uri
	 * @returns {Promise<number | Logger>} Returns a
	 */
	private async _connect(url: string | undefined): Promise<Logger | number> {
		if (url) {
			const start = Date.now();
			try {
				await connect(url, {
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false,
					useUnifiedTopology: true,
					sslValidate: false,
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

	/**
	 * Adds all the listeners to the mongo connection.
	 * @param connection - The mongoose connection
	 * @returns {void}
	 */
	private _addListeners(connection: Connection): void {
		for (const [event, msg] of Object.entries(MONGO_EVENTS)) {
			connection.on(event, () => this.client.logger.verbose(`[MONGO]: ${msg}`));
		}
	}

	/**
	 * Starts the Settings Provider
	 * @returns {SettingsProvider}
	 */
	public async init(): Promise<this> {
		this._addListeners(connection);
		await this._connect(process.env.MONGO);
		await this._cacheAll();
		this.client.logger.info(`[DATABASE] [LAUNCHED] Successfully connected and cached ${i} documents.`);
		return this;
	}
}
