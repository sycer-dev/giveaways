import { Listener } from 'discord-akairo';
import { ActivityType, Constants, Guild } from 'discord.js';
import { Gauge } from 'prom-client';
export interface ReactionStatus {
	text: string;
	type: ActivityType;
}

export default class ReadyListener extends Listener {
	public constructor() {
		super(Constants.Events.CLIENT_READY, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.CLIENT_READY,
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to host some giveaways.`);

		this.client.voteHandler.init();
		this._prometheus();

		this.client.giveawayHandler.init();

		await this.client.user?.setActivity(`giveawaybot.fun | gguide 🎉`, { type: 'WATCHING' });

		this._clearPresences();
		setInterval(() => this._clearPresences(), 9e5);
	}

	private _clearPresences(): void {
		const i = this.client.guilds.cache.reduce((acc: number, { presences: { cache } }: Guild): number => {
			acc += cache.size;
			cache.clear();
			return acc;
		}, 0);
		this.client.emit('debug', `[PRESENCES]: Cleared ${i} presences in ${this.client.guilds.cache.size} guilds.`);
	}

	private _prometheus(): void {
		// scoping issues within the collect funcitons
		const client = this.client;

		this.client.prometheus.metrics.guildCounter = new Gauge({
			name: 'giveaway_bot2_guilds',
			help: 'Total number of all users Giveaway Bot has seen.',
			collect() {
				this.set(client.guilds.cache.size);
			},
		});

		this.client.prometheus.metrics.userCounter = new Gauge({
			name: 'giveaway_bot2_users',
			help: 'Total number of all users Giveaway Bot has seen.',
			collect() {
				const userCount = client.guilds.cache.reduce((prev, { memberCount }) => prev + memberCount, 0);
				this.set(userCount);
			},
		});
	}
}
