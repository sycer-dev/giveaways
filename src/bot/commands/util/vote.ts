import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class VoteCommand extends Command {
	public constructor() {
		super('vpte', {
			aliases: ['vote', 'premium'],
			description: {
				content: 'More information on voting.',
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const { username, id } = this.client.user!;
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.setDescription(`To recieve premium benifits please vote for ${username} at [Top.gg](https://top.gg/bot/${id}).`);
		return msg.util?.send({ embed });
	}
}
