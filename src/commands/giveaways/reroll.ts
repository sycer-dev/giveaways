import { Command } from 'discord-akairo';
import { Message, TextChannel, User } from 'discord.js';

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
	public userPermissions(msg: Message): string | null {
		const guild = this.client.settings.guild.get(msg.guild!.id);
		if (msg.member!.permissions.has('MANAGE_GUILD') || (guild && msg.member!.roles.cache.has(guild.manager)))
			return null;
		return 'notMaster';
	}

	public async exec(msg: Message, { count }: { count: number }): Promise<Message | Message[] | void> {
		const giveaways = this.client.settings.giveaway.filter(
			g => g.complete && g.channelID === msg.channel.id && !g.fcfs && !g.maxEntries,
		);
		if (!giveaways.size) return msg.util?.reply("sorry! I couldn't find any ended giveaways in this channel");
		const g =
			giveaways.size === 1
				? giveaways.first()!
				: giveaways.sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime()).first()!;

		const message = await (this.client.channels.cache.get(g.channelID) as TextChannel).messages
			.fetch(g.messageID)
			.catch(() => null);
		if (!message) return msg.util?.reply('looks like that giveaway was deleted!');
		const reaction = message.reactions.cache.get(g.emoji);
		if (!reaction) return msg.util?.reply('looks like that giveaway was deleted!');

		const users = await reaction.users.fetch();
		const list = users.array().filter(u => u.id !== message.author.id);

		let winners: User[] = [];
		if (list.length <= count) {
			winners = list;
		} else {
			while (winners.length < count) {
				const w = this.client.giveawayHandler.draw(list);
				if (!winners.includes(w)) winners.push(w);
			}
		}

		return msg.channel.send(
			`🎲 Congratz ${winners
				.map(g => g.toString())
				.join(', ')
				.substring(0, 1800)}! You won the giveaway for *${g.title}* on a reroll!`,
		);
	}
}
