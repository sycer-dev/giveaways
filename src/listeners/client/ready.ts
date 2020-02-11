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

		for (const id of this.client.guilds.keys()) {
			const existing = this.client.settings.guild.get(id);
			if (!existing) await this.client.settings.new('guild', { id });
		}

		await this.client.user?.setActivity(`for gguide 🎉`, { type: 'WATCHING' });

		setInterval(async () => {
			for (const g2 of this.client.guilds.values()) {
				g2.presences.clear();
			}
		}, 1000 * 60 * 10);

		setInterval(() => {
			const userCount = this.client.guilds.reduce((acc, g): number => (acc += g.memberCount), 0);
			this.client.prometheus.userHistogram.set(userCount);
			this.client.prometheus.guildHistogram.set(this.client.guilds.size);
		}, 1000 * 15);
	}
}
