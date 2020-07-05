import { Listener } from 'discord-akairo';
import { ActivityType, Constants, Guild } from 'discord.js';

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
		setInterval(() => this._prometheus(), 1000 * 45);

		this.client.giveawayHandler.init();

		this.client.settings.cache.guilds.sweep(({ id }) => !this.client.guilds.cache.has(id));

		for (const id of this.client.guilds.cache.keys()) {
			const existing = this.client.settings.cache.guilds.get(id);
			if (!existing) await this.client.settings.new('guild', { id });
		}

		await this.client.user?.setActivity(`giveawaybot.fun | gguide 🎉`, { type: 'WATCHING' });

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

	private async _prometheus(): Promise<void> {
		const guildCount = (await this.client.shard?.fetchClientValues('guilds.cache.size')) as number[];
		const guilds = guildCount.reduce((acc, val) => (acc += val), 0);
		this.client.prometheus.metrics.guildCounter.set(guilds);

		const userCount = (await this.client.shard?.broadcastEval(
			'this.guilds.cache.reduce((prev, { memberCount }) => (prev + memberCount), 0)',
		)) as number[];
		const users = userCount.reduce((acc, val) => (acc += val), 0);
		this.client.prometheus.metrics.userCounter.set(users);
	}
}
