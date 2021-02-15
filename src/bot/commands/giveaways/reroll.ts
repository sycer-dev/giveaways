import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';
import { Giveaway } from '../../../database';
import { GiveawayType } from '../../util/constants';

export default class ManagerRole extends Command {
	public constructor() {
		super('reroll', {
			category: 'giveaways',
			channel: 'guild',
			aliases: ['reroll', 'redraw'],
			args: [
				{
					id: 'count',
					type: (_, str: string): number | null => {
						const input = parseInt(str, 10);
						if (input && !isNaN(input) && input >= 1) return input;
						return null;
					},
					prompt: {
						start: 'How many people to do you wish to re-draw?',
						retry: 'How many people to do you wish to re-draw? Please proide a number over 0.',
						optional: true,
					},
					default: 1,
				},
			],
			description: {
				content: 'Rerolls a set amount of winners for the most-recently ended giveaway in that channel.',
				usage: '[new winners]',
				examples: ['3', '1', '5'],
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

	public async exec(msg: Message, { count }: { count: number }): Promise<Message | Message[] | void> {
		const giveaways = await Giveaway.find({
			drawn: true,
			channelId: msg.channel.id,
			guildId: msg.guild!.id,
			type: GiveawayType.TRADITIONAL,
		});

		if (!giveaways.length) return msg.util?.reply("sorry! I couldn't find any ended giveaways in this channel");
		const g =
			giveaways.length === 1 ? giveaways[0]! : giveaways.sort((a, b) => b.drawAt.getTime() - a.drawAt.getTime())[0]!;

		const message = await (this.client.channels.cache.get(g.channelId) as TextChannel).messages
			.fetch(g.messageId)
			.catch(() => null);
		if (!message) return msg.util?.reply('looks like that giveaway was deleted!');
		const reaction = message.reactions.cache.get(g.emoji);
		if (!reaction) return msg.util?.reply('looks like that giveaway was deleted!');

		const list = await this.client.giveawayHandler.fetchWinners(reaction);
		const winners = this.client.giveawayHandler.pullWinners(list, count);

		return msg.channel.send(
			`🎲 Congratulations ${winners
				.map((g) => g.toString())
				.join(', ')
				.substring(0, 1800)}! You won the giveaway for *${g.title}* on a reroll!`,
		);
	}
}
