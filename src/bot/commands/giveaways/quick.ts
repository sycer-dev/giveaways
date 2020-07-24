/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import ms from '@naval-base/ms';
import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';
import * as nodemoji from 'node-emoji';
import prettyms from 'pretty-ms';
import { PRETTY_MS_SETTINGS } from '../../util/constants';
import { Giveaway } from '../../../database';

export default class Giveaways extends Command {
	public constructor() {
		super('quick', {
			aliases: ['quick', 'gw', 'quickstart'],
			description: {
				content: 'Start a giveaway within one command.',
				usage: '<channel> <winners> <emoji> <duration> <...title>',
				examples: [
					'#giveaways 1 🍕 3h Discord Nitro Code!',
					'giveaways 3 :blobgo: 49min Blob T-Shirt!',
					'222197033908436994 1 🎉 5m FLASH GIVEAWAY! Discord Nitro Code!',
				],
			},
			category: 'giveaways',
			channel: 'guild',
			typing: true,
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What channel would you like to start this giveaway in?',
						retry:
							'What channel would you like to start this giveaway in? Please provide a valid channel name, ID or mention.',
					},
				},
				{
					id: 'winnerCount',
					type: (_, str: string): number | null => {
						const input = parseInt(str, 10);
						if (input && !isNaN(input) && input >= 1 && input <= 200) return input;
						return null;
					},
					prompt: {
						start: 'How many winners would you like there to be?',
						retry: 'How many winners would you like there to be? Please provide a valid number over 0 and less than or equal to 200.',
					},
				},
				{
					id: 'emoji',
					type: (_: Message, str: string): string | null => {
						if (!str) return null;

						const unicode = nodemoji.find(str);
						if (unicode) return unicode.emoji;

						// @ts-ignore
						const custom = this.client.util.resolveEmoji(str, this.client.emojis.cache);
						if (custom) return custom.id;
						return null;
					},
					prompt: {
						start: "Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server.",
						retry:
							"Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server. Some other regular emojis may not work due to Discord's weird emoji rules.",
					},
				},
				{
					id: 'duration',
					type: (_: Message, str: string): number | null => {
						if (!str) return null;
						const duration = ms(str);
						if (duration && duration >= 3000 && !isNaN(duration)) return duration;
						return null;
					},
					prompt: {
						start:
							'How long would you like this giveaway to last? Please say something like `1d` or `3h`. **NO SPACES**.',
						retry:
							'How long would you like this giveaway to last? Please say something like `1d` or `3h`. **NO SPACES**.',
					},
				},
				{
					id: 'title',
					match: 'restContent',
					type: 'string',
					prompt: {
						start: 'Finally, what would you like to title this giveaway?',
					},
				},
			],
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

	public async exec(
		msg: Message,
		{
			channel,
			winnerCount,
			emoji,
			duration,
			title,
		}: { channel: TextChannel; winnerCount: number; emoji: string; duration: number; title: string },
	): Promise<Message | Message[] | undefined> {
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.setFooter(`${winnerCount} Winner${winnerCount === 1 ? '' : 's'} • Ends at`)
			.setTimestamp(new Date(Date.now() + duration))
			.setTitle(title)
			.addFields(
				{ name: 'Time Remaining', value: `\`${prettyms(duration, PRETTY_MS_SETTINGS) || '.'}\`` },
				{
					name: 'Host',
					value: `${msg.author} [\`${msg.author.tag}\`]`,
				},
			)
			.setDescription(`React with ${this.client.emojis.cache.get(emoji) ?? emoji} to enter!`);

		const m = await channel.send('🎉 **GIVEAWAY** 🎉', { embed });
		await Giveaway.create({
			title,
			emoji,
			guildId: msg.guild!.id,
			channelId: channel.id,
			messageId: m.id,
			winners: winnerCount,
			drawAt: new Date(Date.now() + duration),
			createdBy: msg.author.id,
		}).save();
		await m.react(emoji);

		return msg.util?.reply(`successfully started giveaway in ${channel}.`);
	}
}
