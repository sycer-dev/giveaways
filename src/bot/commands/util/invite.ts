import { stripIndents } from 'common-tags';
import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class InviteCommand extends Command {
	public constructor() {
		super('invite', {
			aliases: ['invite', 'inv', 'hewlp'],
			description: {
				content: 'Returns info on our support server and a bot invite.',
			},
			category: 'utilities',
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | undefined> {
		const embed = this.client.util.embed().setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.setDescription(stripIndents`
                You can invite **${
									this.client.user?.username
								}** to your server with [this](${await this.client.generateInvite(346176)}) link!
                You can join our **Support Server** by clicking [this link](https://fyko.net/discord)!
            `);

		return msg.util?.send({ embed });
	}
}
