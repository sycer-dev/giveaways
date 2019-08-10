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
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to cook 'sm shit.`);
		this.client.giveawayHandler.init();

		for (const id of this.client.guilds.keys()) {
			const existing = this.client.settings!.guild.get(id);
			if (!existing) await this.client.settings!.new('guild', { id });
		}

		setInterval(async () => {
			for (const g2 of this.client.guilds.values()) {
				g2.presences.clear();
			}
		}, 900);
	}
}
