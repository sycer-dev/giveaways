import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';
import { Giveaway } from '../../../database';

export default class ListCommand extends Command {
	public constructor() {
		super('list', {
			category: 'giveaways',
			channel: 'guild',
			aliases: ['list'],
			description: {
				content: 'Lists all ongoing giveaways.',
			},
		});
	}

	// @ts-ignore
	public async userPermissions(msg: Message): Promise<string | null> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (
			msg.member!.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			(guild?.manager && msg.member!.roles.cache.has(guild.manager))
		)
			return null;
		return 'notMaster';
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const giveaways = await Giveaway.find({ drawn: false, guildId: msg.guild!.id });
		if (!giveaways.length) return msg.util?.reply("sorry! I couldn't find any ongoing giveaways.");

		const gs = giveaways.map((g, i) => {
			const type = g.fcfs ? 'FCFS' : g.maxEntries ? 'Limited Entries' : 'Traditional';
			return `\`[${i + 1}]\` - ${type} Giveaway in ${
				this.client.channels.cache.get(g.channelId) ?? '#deleted-channel'
			}. [Jump!](https://discordapp.com/channels/${g.guildId}/${g.channelId}/${g.messageId}/)`;
		});

		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.setAuthor(
				'Live Giveaways',
				msg.guild!.iconURL({ dynamic: true, size: 2048 }) ??
					this.client.user!.displayAvatarURL({ dynamic: true, size: 2048 }),
			)
			.setDescription(gs.join('\n').substring(0, 2048));

		return msg.util?.send({ embed });
	}
}
