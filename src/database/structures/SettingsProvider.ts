import { Collection } from 'discord.js';
import { connect, connection, Connection, Document, Model } from 'mongoose';
import GiveawayModel, { Giveaway } from '../models/Giveaway';
import GuildModel, { Guild } from '../models/Guild';
import { Logger } from 'winston';
import { MONGO_EVENTS } from '../util/constants';
import GiveawayClient from '../../bot/client/GiveawayClient';

/**
 * The key, model and cached collection of a database model.
 * @interface
 */
interface Combo {
	cache: Collection<string, any>;
	key: string;
	model: Model<any>;
}

/**
 * The Settings Provider that handles all database reads and rights.
 * @private
 */
export default class SettingsProvider {
	protected readonly client: GiveawayClient;

	protected readonly giveaways: Collection<string, Giveaway> = new Collection();
	protected readonly guilds: Collection<string, Guild> = new Collection();

	protected readonly GiveawayModel = GiveawayModel;
	protected readonly GuildModel = GuildModel;

	public cachedOnStartup = 0;

	/**
	 *
	 * @param {GiveawayClient} client - The extended Akairo Client
	 */
	public constructor(client: GiveawayClient) {
		this.client = client;
	}

	/**
	 * Retuns all the collection caches.
	 */
	public get cache() {
		return {
			giveaways: this.giveaways,
			guilds: this.guilds,
		};
	}

	/**
	 * Returns the database combos
	 */
	public get combos(): Combo[] {
		return [
			{
				cache: this.giveaways,
				key: 'giveaway',
				model: this.GiveawayModel,
			},
			{
				cache: this.guilds,
				key: 'guild',
				model: this.GuildModel,
			},
		];
	}

	/**
	 * Creates a new database document with the provided collection name and data.
	 * @param {Types} type - The collection name
	 * @param {object} data - The data for the new document
	 */
	public async new(type: 'giveaway', data: Partial<Giveaway>): Promise<Giveaway>;
	public async new(type: 'guild', data: Partial<Guild>): Promise<Guild>;
	public async new(type: string, data: object): Promise<Document> {
		const combo = this.combos.find(c => c.key === type);
		if (combo) {
			const document = new combo.model(data);
			await document.save();
			this.client.logger.data(`[DATABASE] Made new ${combo.model.modelName} document with ID of ${document._id}.`);
			combo.cache.set(document.id, document);
			return document;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Updates the a database document's data.
	 * @param {Types} type - The collection name
	 * @param {object | string} key - The search paramaters for the document. Accepts find params or ID
	 * @param {object} data - The data you wish to overwrite in the update
	 * @returns {Promise<Faction | Guild | null>}
	 */
	public async set(
		type: 'giveaway',
		key: Partial<Giveaway> | string,
		data: Partial<Giveaway>,
	): Promise<Giveaway | null>;

	public async set(type: 'guild', key: Partial<Guild> | string, data: Partial<Guild>): Promise<Guild | null>;
	public async set(type: string, key: object | string, data: object): Promise<Document | null> {
		const combo = this.combos.find(c => c.key === type);
		if (combo) {
			const opts = typeof key === 'string' ? { _id: key } : key;
			const document = await combo.model.findOneAndUpdate(opts, { $set: data }, { new: true });
			if (document) {
				this.client.logger.verbose(`[DATABASE] Edited ${combo.model.modelName} document with ID of ${document._id}.`);
				combo.cache.set(document.id, document);
				return document;
			}
			return null;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Removes a database document.
	 * @param {Types} type - The collection name
	 * @param {object} data - The search paramaters for the document
	 * @returns {Promise<Faction | Guild | null>>} The document that was removed, if any.
	 */
	public async remove(type: 'giveaway', data: Partial<Giveaway>): Promise<Giveaway | null>;
	public async remove(type: 'guild', data: Partial<Guild>): Promise<Guild | null>;
	public async remove(type: string, data: object): Promise<Document | null> {
		const combo = this.combos.find(c => c.key === type);
		if (combo) {
			const document = await combo.model.findOneAndRemove(data);
			if (document) {
				this.client.logger.verbose(`[DATABASE] Edited ${combo.model.modelName} document with ID of ${document._id}.`);
				combo.cache.delete(document.id);
				return document;
			}
			return null;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Caching all database documents.
	 * @returns {number} The amount of documents cached total.
	 * @private
	 */
	private async _cacheAll(): Promise<number> {
		for (const combo of this.combos) await this._cache(combo);
		return this.cachedOnStartup;
	}

	/**
	 * Caching each collection's documents.
	 * @param {Combo} combo - The combo name
	 * @returns {number} The amount of documents cached from that collection.
	 * @private
	 */
	private async _cache(combo: Combo): Promise<number> {
		const items = await combo.model.find();
		for (const i of items) combo.cache.set(i.id, i);
		this.client.logger.verbose(
			`[DATABASE]: Cached ${items.length.toLocaleString('en-US')} items from ${combo.model.modelName}.`,
		);
		return (this.cachedOnStartup += items.length);
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
				});
			} catch (err) {
				this.client.logger.error(`[DATABASE] Error when connecting to MongoDB:\n${err.stack}`);
				process.exit(1);
			}
			return this.client.logger.verbose(`[DATABASE] Connected to MongoDB in ${Date.now() - start}ms.`);
		}
		this.client.logger.error('[DATABASE] No MongoDB url provided!');
		return process.exit(1);
	}

	/**
	 * Adds all the listeners to the mongo connection.
	 * @param connection - The mongoose connection
	 * @returns {void}
	 * @private
	 */
	private _addListeners(connection: Connection): void {
		for (const [event, msg] of Object.entries(MONGO_EVENTS)) {
			connection.on(event, () => this.client.logger.data(`[DATABASE]: ${msg}`));
		}
	}

	/**
	 * Starts the Settings Provider
	 * @returns {SettingsProvider}
	 */
	public async init(): Promise<this> {
		this._addListeners(connection);
		await this._connect(process.env.MONGO);
		this.client.logger.verbose(`[DATABASE]: Now caching ${this.combos.length} schema documents.`);
		await this._cacheAll();
		this.client.logger.info(
			`[DATABASE] [LAUNCHED] Successfully connected and cached ${this.cachedOnStartup} documents.`,
		);
		return this;
	}
}
