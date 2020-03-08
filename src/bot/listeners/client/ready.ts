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
		await this.client.giveawayAPI.init();
		this.client.giveawayHandler.init();
		this.client.voteHandler.init();

		for (const id of this.client.guilds.cache.keys()) {
			const existing = this.client.settings.cache.guilds.get(id);
			if (!existing) await this.client.settings.new('guild', { id });
		}

		await this.client.user?.setActivity(`giveawaybot.fun | gguide 🎉`, { type: 'WATCHING' });

		setInterval(() => this._clearPresences(), 9e5);

		setInterval(() => this._prometheus(), 1000 * 10);
	}

	private _clearPresences(): void {
		const i = this.client.guilds.cache.reduce((acc: number, g: Guild): number => {
			acc += g.presences.cache.size;
			g.presences.cache.clear();
			return acc;
		}, 0);
		this.client.emit('debug', `[PRESNCES]: Cleared ${i} presneces in ${this.client.guilds.cache.size} guilds.`);
	}

	private _prometheus(): void {
		const userCount = this.client.guilds.cache.reduce((acc, g): number => (acc += g.memberCount), 0);
		this.client.prometheus.userCounter.set(userCount);
		this.client.prometheus.guildCounter.set(this.client.guilds.cache.size);
		this.client.prometheus.giveawayCounter.set(this.client.settings.cache.giveaways.size);
		this.client.prometheus.activeGiveawaysCounter.set(
			this.client.settings.cache.giveaways.filter(g => !g.complete).size,
		);
		this.client.prometheus.completedGiveawaysCounter.set(
			this.client.settings.cache.giveaways.filter(
				g => g.complete && g.endsAt >= new Date(Date.now() + 1000 * 60 * 60 * 24),
			).size,
		);
	}
}
