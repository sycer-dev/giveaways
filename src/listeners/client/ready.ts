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

		for (const id of this.client.guilds.keys()) {
			const existing = this.client.settings.guild.get(id);
			if (!existing) await this.client.settings.new('guild', { id });
		}

		await this.client.user?.setActivity(`for @${this.client.user?.username} guide 🎁`, { type: 'WATCHING' });

		setInterval(async () => {
			for (const g2 of this.client.guilds.values()) {
				g2.presences.clear();
			}
		}, 1000 * 60 * 10);
	}
}