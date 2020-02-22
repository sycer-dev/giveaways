import { Listener } from 'discord-akairo';
import { ActivityType } from 'discord.js';

export interface ReactionStatus {
	text: string;
	type: ActivityType;
}

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			category: 'client',
			emitter: 'client',
			event: 'ready',
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to host some giveaways.`);
		this.client.giveawayHandler.init();
		this.client.voteHandler.init();

		this.client.promServer.listen(5501);

		for (const id of this.client.guilds.cache.keys()) {
			const existing = this.client.settings.cache.guilds.get(id);
			if (!existing) await this.client.settings.new('guild', { id });
		}

		await this.client.user?.setActivity(`for gguide 🎉`, { type: 'WATCHING' });

		setInterval(async () => {
			for (const g2 of this.client.guilds.cache.values()) {
				g2.presences.cache.clear();
			}
		}, 1000 * 60 * 10);

		setInterval(() => this._prometheus(), 1000 * 10);
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
