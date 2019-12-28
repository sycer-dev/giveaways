import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, MessageReaction, User, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import prettyMilliseconds from 'pretty-ms';
const ms = require('ms'); // eslint-disable-line

export interface Entries {
	string: string;
	entries: number;
}

export default class Giveaways extends Command {
	public constructor() {
		super('giveaways', {
			aliases: ['create', 'giveaway', 'new', 'fcfs', 'raffle'],
			description: {
				content: 'Opens a Giveaway Builder where you can create a new giveaway.',
			},
			category: 'giveaways',
			channel: 'guild',
			args: [
				{
					id: 'type',
					type: ['1', '2', '3'],
					prompt: {
						start: stripIndents`
							What type of giveaway would you like to make?

							\`[1]\` Traditional - Set-duration giveaway that allows all users to enter
							\`[2]\` First Come, First Serve - The first x people to react have a 100% chance of winning
							\`[3]\` Limited Entries - Traditional giveaway that ends when the entry cap is reached

						`,
						retry: stripIndents`
							What type of giveaway would you like to make?

							\`[1]\` Traditional - Set-duration giveaway that allows all users to enter
							\`[2]\` First Come, First Serve - The first x people to react have a 100% chance of winning
							\`[3]\` Limited Entries - Traditional giveaway that ends when the entry cap is reached

						`,
					},
				},
			],
		});
	}

	// @ts-ignore
	public userPermissions(msg: Message): string | null {
		const guild = this.client.settings.guild.get(msg.guild!.id);
		if (msg.member!.permissions.has('MANAGE_GUILD') || (guild && msg.member!.roles.has(guild.manager))) return null;
		return 'notMaster';
	}

	public async exec(msg: Message, { type }: { type: string }): Promise<Message | Message[] | void> {
		const guild = this.client.settings.guild.get(msg.guild!.id);
		const preifx = (this.handler.prefix as PrefixSupplier)(msg);
		if (type === '1') {
			return this.tierOne(msg);
		} else if (type === '2') {
			if (!guild?.premium)
				return msg.util?.reply(
					`sorry! This command is reserved for premium guilds. Vote for us on DiscordBots.org to recieve premium benifits. Run \`${preifx}vote\` for more info.`,
				);
			return this.tierTwo(msg);
		} else if (type === '3') {
			if (!guild?.premium)
				return msg.util?.reply(
					`sorry! This command is reserved for premium guilds. Vote for us on DiscordBots.org to recieve premium benifits. Run \`${preifx}vote\` for more info.`,
				);
			return this.tierThree(msg);
		}
		return msg.util!.reply('uhhhh, something went wrong. Please rerun this command.');
	}

	public async promptAndReturn(msg: Message): Promise<null | Message> {
		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
			max: 1,
			time: 30000,
		});
		if (!collect || collect.size !== 1 || !collect.first()) return null;
		return collect.first()!;
	}

	public async getEmoji(msg: Message): Promise<MessageReaction | null | Message | Message[]> {
		const w = await msg.channel.send('Please react to this message with the emoji you wish to use.');
		const collect = await w.awaitReactions((r: MessageReaction, u: User): boolean => msg.author.id === u.id, {
			max: 1,
			time: 30000,
		});
		if (!collect || collect.size !== 1) return msg.util!.reply('you took too long! Giveaway builder closed.');
		const rawREACTION = collect.first()!;
		if (w.deletable) await w.delete();
		if (rawREACTION.emoji.id && !this.client.emojis.get(rawREACTION.emoji.id)) {
			const m = await msg.channel.send("I don't have access to that emoji! Please try again.");
			await m.delete({ timeout: 3500 });
			return null;
		}
		return rawREACTION;
	}

	public async getChannel(msg: Message): Promise<null | Message | Message[] | TextChannel> {
		const w = await msg.channel.send('What would you like to set the giveaway channel to?');
		const collect = await this.promptAndReturn(msg);
		if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
		const chan = this.client.util.resolveChannel(
			collect.content,
			msg.guild!.channels.filter(c => c.type === 'text'),
		);
		if (w.deletable) await w.delete();
		if (collect.deletable) await collect.delete();
		if (!chan) {
			const m = await msg.channel.send('Invalid channel, please try agian.');
			await m.delete({ timeout: 3500 });
			return null;
		}
		return chan as TextChannel;
	}

	public async getTitle(msg: Message): Promise<null | Message | Message[] | string> {
		const w = await msg.channel.send('What would you like to set the title of this giveaway to?');
		const collect = await this.promptAndReturn(msg);
		if (!collect || !collect.content) return msg.util!.reply('you took too long! Giveaway builder closed.');
		if (w.deletable) await w.delete();
		if (collect.deletable) await collect.delete();
		return collect.content;
	}

	public async tierOne(msg: Message): Promise<Message | Message[]> {
		const EMOJIS = ['📋', '💰', '📦', '🎉', '⏰', '📊', '🛑'];
		const live = true;
		let title;
		let winnerCount;
		let channel: TextChannel | null = null;
		let emoji = '🎉';
		let duration;
		let rawEMOJI = emoji;
		const entries: Entries[] = [];
		const m = await msg.channel.send('Traditional Giveaway Builder');
		for (const e of EMOJIS) await m.react(e);
		while (live) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor || this.client.config.color)
				.addField(
					'Possible Methods',
					stripIndents`
						\`📋\` - Title
						\`💰\` - Winner Count
						\`📦\` - Channel
						\`🎉\` - Emoji
						\`⏰\` - Duration
						\`📊\` - Role-based Extra Entries
					`,
				)
				.addField(
					'Current Settings',
					stripIndents`
						\`📋\` Title - ${title || 'None set yet.'}

						\`💰\` Winner Count - ${winnerCount || 'None set yet.'}

						\`📦\` Channel - ${channel || 'None set yet.'}

						\`🎉\` Emoij - ${rawEMOJI}

						\`⏰\` Duration - ${duration ? ms(duration, { long: true }) : 'None set yet.'}

						__Role-based Extra Entries__
						Default - \`1\` Entry
						${entries.map(e => `<@&${e.string}> - \`${e.entries}\` entries`).join('\n')}
					`,
				);
			await m.edit({ embed });

			if (title && winnerCount && channel && rawEMOJI && duration) {
				await m.react('✅');
				EMOJIS.push('✅');
			}

			const collector = await m.awaitReactions(
				(r: MessageReaction, u: User): boolean => msg.author.id === u.id && EMOJIS.includes(r.emoji.name),
				{
					max: 1,
					time: 60000,
				},
			);
			if (!collector || collector.size !== 1) {
				if (m.editable) await m.edit('You took too long! Giveaway builder closed.', { embed: null });
				m.reactions.removeAll();
				return m;
			}
			const emote = collector.first()!.emoji.name;
			await m.reactions.get(emote)!.users.remove(msg.author.id);

			if (emote === '📋') {
				const get = await this.getTitle(msg);
				if (get && typeof get === 'string') title = get;
			} else if (emoji === '🛑') {
				await m.edit('Giveaway builder closed.', { embed: null });
				await m.reactions.removeAll();
				return m;
			} else if (emote === '💰') {
				const w = await msg.channel.send('What would you like to set the winner count to?');
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const number = parseInt(collect.content, 10);
				if (!number || (number && number < 1 && !isNaN(number))) {
					const m = await msg.channel.send('Invalid number, please try agian.');
					await m.delete({ timeout: 3500 });
				} else {
					winnerCount = number;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '📦') {
				const get = await this.getChannel(msg);
				if (get && get instanceof TextChannel) channel = get;
			} else if (emote === '🎉') {
				const get = await this.getEmoji(msg);
				if (get && get instanceof MessageReaction) {
					emoji = get.emoji.id || get.emoji.name;
					rawEMOJI = get.emoji.toString();
				}
			} else if (emote === '⏰') {
				const w = await msg.channel.send(
					'How long would you like the giveaway to last? Please say something like `5 minutes` or `3d`.',
				);
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const dur = ms(collect.content);
				if (!dur || dur < 3000 || isNaN(dur)) {
					const m = await msg.channel.send(
						'Invalid duration, please try agian. Remeber, it must be greater than 3 seconds.',
					);
					await m.delete({ timeout: 3500 });
				} else if (dur >= 1000 * 60 * 60 * 24 * 31) {
					const m = await msg.channel.send('You cannot run a giveaway for longer than 1 month.');
					await m.delete({ timeout: 3500 });
				} else {
					duration = dur;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '📊') {
				const w = await msg.channel.send('What is the role you wish to add an entry boost for?');
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const role = this.client.util.resolveRole(collect.content, await msg.guild!.roles.fetch());
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();

				if (role === undefined) {
					const m = await msg.channel.send('Invalid role. Please try again.');
					await m.delete({ timeout: 3500 });
				} else {
					const x = await msg.channel.send(`How many extra entries do you want **${role.name}** to get?`);
					const collect2 = await this.promptAndReturn(msg);
					if (!collect2) return msg.util!.reply('you took too long! Giveaway builder closed.');
					const number = parseInt(collect2.content, 10);
					if (!number || (number < 1 && isNaN(number))) {
						const m = await msg.channel.send('Invalid number. Please try again.');
						await m.delete({ timeout: 3500 });
					} else {
						entries.push({ string: role.id, entries: number });
					}
					if (x.deletable) await x.delete();
					if (collect2.deletable) await collect2.delete();
				}
			} else if (emote === '✅') {
				if (!title || !winnerCount || !emoji || !duration) {
					const m = await msg.channel.send('You cannot create the giveaway until all parameters are provided!');
					await m.delete({ timeout: 3500 });
				} else if (
					channel instanceof TextChannel &&
					!channel.permissionsFor(this.client.user!)!.has(['EMBED_LINKS', 'SEND_MESSAGES', 'ADD_REACTIONS'])
				) {
					const m = await msg.channel.send(
						`Please ensure I have \`Embed Links\`, \`Send Messages\`, and \`Add Reactions\` in ${channel}`,
					);
					await m.delete({ timeout: 3500 });
				} else if (emoji.length > 2 && !this.client.emojis.get(emoji)) {
					const m = await msg.channel.send(
						`I don\'t have access to the emoji you provided. Please change the emoji and try again.`,
					);
					await m.delete({ timeout: 3500 });
				} else {
					try {
						const embed = this.client.util
							.embed()
							.setColor(msg.guild?.me?.displayColor || this.client.config.color)
							.setFooter(`${winnerCount} Winner${winnerCount === 1 ? '' : 's'} • Ends at`)
							.setTimestamp(new Date(Date.now() + (duration as number)))
							.setTitle(title)
							.addField('Time Remaining', `\`${prettyMilliseconds(duration, { verbose: true })}\``)
							.addField(
								'Entries',
								stripIndents`
								${msg.guild!.roles.everyone} - \`1\` Entry
								${entries.map(e => `<@&${e.string}> - \`${e.entries}\` entries`).join('\n')}
							`,
							)
							.addField('Host', `${msg.author} [\`${msg.author.tag}\`]`)
							.setDescription(`React with ${rawEMOJI} to enter!`);
						const mss = await channel!.send('🎉 **GIVEAWAY** 🎉', { embed });
						await this.client.settings.new('giveaway', {
							title,
							emoji,
							guildID: msg.guild!.id,
							channelID: channel!.id,
							messageID: mss.id,
							winnerCount,
							endsAt: new Date(Date.now() + (duration as number)),
							createdBy: msg.author.id,
							boosted: entries,
						});
						await mss.react(emoji);

						if (m.editable) {
							m.reactions.removeAll();
							return m.edit(`Successfully started giveaway in ${channel}.`, { embed: null });
						}
						return msg.util!.send(`Successfully started giveaway in ${channel}.`);
					} catch (err) {
						await m.edit('', { embed: null });
						const ms = await msg.channel.send(`An error occured when trying to start that giveaway: ${err}.`);
						return ms.delete({ timeout: 5000 });
					}
				}
			}
		}
		return msg;
	}

	public async tierTwo(msg: Message): Promise<Message | Message[]> {
		const EMOJIS = ['📋', '💰', '📦', '🎉', '🛑'];
		const live = true;
		let title;
		let winnerCount;
		let channel: TextChannel | null = null;
		let emoji = '🎉';
		let rawEMOJI = emoji;
		const m = await msg.channel.send('First Come, First Serve Giveaway Builder');
		for (const e of EMOJIS) await m.react(e);
		while (live) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor || this.client.config.color)
				.addField(
					'Possible Methods',
					stripIndents`
					\`📋\` - Title
					\`💰\` - Winner Count
					\`📦\` - Channel
					\`🎉\` - Emoji
				`,
				)
				.addField(
					'Current Settings',
					stripIndents`
					\`📋\` Title - ${title || 'None set yet.'}

					\`💰\` Winner Count - ${winnerCount || 'None set yet.'}

					\`📦\` Channel - ${channel || 'None set yet.'}

					\`🎉\` Emoij - ${rawEMOJI}
				`,
				);
			await m.edit({ embed });

			if (title && winnerCount && channel && emoji) {
				await m.react('✅');
				EMOJIS.push('✅');
			}

			const collector = await m.awaitReactions(
				(r: MessageReaction, u: User): boolean => msg.author.id === u.id && EMOJIS.includes(r.emoji.name),
				{
					max: 1,
					time: 60000,
				},
			);
			if (!collector || collector.size !== 1) {
				if (m.editable) await m.edit('You took too long! Giveaway builder closed.', { embed: null });
				m.reactions.removeAll();
				return m;
			}
			const emote = collector.first()!.emoji.name;
			await m.reactions.get(emote)!.users.remove(msg.author.id);

			if (emote === '📋') {
				const get = await this.getTitle(msg);
				if (get && typeof get === 'string') title = get;
			} else if (emoji === '🛑') {
				if (m.editable) await m.edit('Giveaway builder closed.', { embed: null });
				await m.reactions.removeAll();
				return m;
			} else if (emote === '💰') {
				const w = await msg.channel.send('What would you like to set the winner count to?');
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const number = parseInt(collect.content, 10);
				if (!number || (number && number < 1 && !isNaN(number))) {
					const m = await msg.channel.send('Invalid number, please try agian.');
					await m.delete({ timeout: 3500 });
				} else {
					winnerCount = number;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '📦') {
				const get = await this.getChannel(msg);
				if (get && get instanceof TextChannel) channel = get;
			} else if (emote === '🎉') {
				const get = await this.getEmoji(msg);
				if (get && get instanceof MessageReaction) {
					emoji = get.emoji.id || get.emoji.name;
					rawEMOJI = get.emoji.toString();
				}
			} else if (emote === '✅') {
				if (!title || !winnerCount || !emoji) {
					const m = await msg.channel.send('You cannot create the giveaway until all parameters are provided!');
					await m.delete({ timeout: 3500 });
				} else if (
					channel instanceof TextChannel &&
					!channel.permissionsFor(this.client.user!)!.has(['EMBED_LINKS', 'SEND_MESSAGES', 'ADD_REACTIONS'])
				) {
					const m = await msg.channel.send(
						`Please ensure I have \`Embed Links\`, \`Send Messages\`, and \`Add Reactions\` in ${channel}`,
					);
					await m.delete({ timeout: 3500 });
				} else if (emoji.length > 2 && !this.client.emojis.get(emoji)) {
					const m = await msg.channel.send(
						`I don\'t have access to the emoji you provided. Please change the emoji and try again.`,
					);
					await m.delete({ timeout: 3500 });
				} else {
					try {
						const embed = this.client.util.embed().setColor(msg.guild?.me?.displayColor || this.client.config.color)
							.setDescription(stripIndents`
								The first ${
									winnerCount === 1 ? `\`${winnerCount}\` people` : 'person'
								} to react with ${rawEMOJI} will win the drop for...
								
								**${title}**!
								
								React before there are no more slots left!
							`);
						const mss = await channel!.send('🎉 **FIRST COME, FIRST SERVE** 🎉', { embed });
						await this.client.settings.new('giveaway', {
							title,
							emoji,
							guildID: msg.guild!.id,
							channelID: channel!.id,
							messageID: mss.id,
							winnerCount,
							createdBy: msg.author.id,
							fcfs: true,
						});
						await mss.react(emoji);

						if (m.editable) {
							m.reactions.removeAll();
							return m.edit(`Successfully started giveaway in ${channel}.`, { embed: null });
						}
						return msg.util!.send(`Successfully started giveaway in ${channel}.`);
					} catch (err) {
						await m.edit('', { embed: null });
						const alsoM = await msg.channel.send(`An error occured when trying to start that giveaway: ${err}.`);
						return alsoM.delete({ timeout: 5000 });
					}
				}
			}
		}
		return msg;
	}

	public async tierThree(msg: Message): Promise<Message | Message[]> {
		const EMOJIS = ['📋', '👥', '💰', '📦', '⏰', '🎉', '🛑'];
		const live = true;
		let title;
		let maxEntries;
		let winnerCount;
		let channel: TextChannel | null = null;
		let emoji = '🎉';
		let rawEMOJI = emoji;
		let duration;
		const m = await msg.channel.send('Limited Entries Giveaway Builder');
		for (const e of EMOJIS) await m.react(e);
		while (live) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor || this.client.config.color)
				.addField(
					'Possible Methods',
					stripIndents`
					\`📋\` - Title
					\`👥\` - Max Entries
					\`💰\` - Winner Count
					\`📦\` - Channel
					\`⏰\` - Duration (if the max entries is not hit)
					\`🎉\` - Emoji
				`,
				)
				.addField(
					'Current Settings',
					stripIndents`
					\`📋\` Title - ${title || 'None set yet.'}

					\`👥\` Max Entries - ${maxEntries || 'None set yet.'}

					\`💰\` Winner Count - ${winnerCount || 'None set yet.'}

					\`📦\` Channel - ${channel || 'None set yet.'}

					\`⏰\` Duration -  ${duration ? ms(duration, { long: true }) : 'None set yet.'}

					\`🎉\` Emoji - ${rawEMOJI}
				`,
				);
			await m.edit({ embed });

			if (title && maxEntries && channel && emoji && winnerCount && duration) {
				await m.react('✅');
				EMOJIS.push('✅');
			}

			const collector = await m.awaitReactions(
				(r: MessageReaction, u: User): boolean => msg.author.id === u.id && EMOJIS.includes(r.emoji.name),
				{
					max: 1,
					time: 60000,
				},
			);
			if (!collector || collector.size !== 1) {
				if (m.editable) await m.edit('You took too long! Giveaway builder closed.', { embed: null });
				m.reactions.removeAll();
				return m;
			}
			const emote = collector.first()!.emoji.name;
			await m.reactions.get(emote)!.users.remove(msg.author.id);

			if (emote === '📋') {
				const get = await this.getTitle(msg);
				if (get && typeof get === 'string') title = get;
			} else if (emoji === '🛑') {
				if (m.editable) await m.edit('Giveaway builder closed.', { embed: null });
				await m.reactions.removeAll();
				return m;
			} else if (emote === '💰') {
				const w = await msg.channel.send('What would you like to set the number of winners to?');
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const number = parseInt(collect.content, 10);
				if (!number || (number && number < 1 && !isNaN(number))) {
					const m = await msg.channel.send('Invalid number, please try agian.');
					await m.delete({ timeout: 3500 });
				} else {
					winnerCount = number;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '👥') {
				const w = await msg.channel.send('What would you like to set the max number of entries to?');
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const number = parseInt(collect.content, 10);
				if (!number || (number && number < 1 && !isNaN(number))) {
					const m = await msg.channel.send('Invalid number, please try agian.');
					await m.delete({ timeout: 3500 });
				} else {
					maxEntries = number;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '📦') {
				const get = await this.getChannel(msg);
				if (get && get instanceof TextChannel) channel = get;
			} else if (emote === '🎉') {
				const get = await this.getEmoji(msg);
				if (get && get instanceof MessageReaction) {
					emoji = get.emoji.id || get.emoji.name;
					rawEMOJI = get.emoji.toString();
				}
			} else if (emote === '⏰') {
				const w = await msg.channel.send(
					'How long would you like the giveaway to last? Please say something like `5 minutes` or `3d`.',
				);
				const collect = await this.promptAndReturn(msg);
				if (!collect) return msg.util!.reply('you took too long! Giveaway builder closed.');
				const dur = ms(collect.content);
				if (!dur || isNaN(dur)) {
					const m = await msg.channel.send(
						'Invalid duration, please try agian. Remeber, it must be greater than 3 seconds.',
					);
					await m.delete({ timeout: 3500 });
				} else if (dur >= 1000 * 60 * 60 * 24 * 31) {
					const m = await msg.channel.send('You cannot run a giveaway for longer than 1 month.');
					await m.delete({ timeout: 3500 });
				} else if (dur <= 3000) {
					const m = await msg.channel.send('You cannot run a giveaway for shorter than 3 seconds.');
					await m.delete({ timeout: 3500 });
				} else {
					duration = dur;
				}
				if (w.deletable) await w.delete();
				if (collect.deletable) await collect.delete();
			} else if (emote === '✅') {
				if (!title || !maxEntries || !emoji || !winnerCount || !channel) {
					const m = await msg.channel.send('You cannot create the giveaway until all parameters are provided!');
					await m.delete({ timeout: 3500 });
				} else if (
					channel instanceof TextChannel &&
					!channel.permissionsFor(this.client.user!)!.has(['EMBED_LINKS', 'SEND_MESSAGES', 'ADD_REACTIONS'])
				) {
					const m = await msg.channel.send(
						`Please ensure I have \`Embed Links\`, \`Send Messages\`, and \`Add Reactions\` in ${channel}`,
					);
					await m.delete({ timeout: 3500 });
				} else if (emoji.length > 2 && !this.client.emojis.get(emoji)) {
					const m = await msg.channel.send(
						`I don\'t have access to the emoji you provided. Please change the emoji and try again.`,
					);
					await m.delete({ timeout: 3500 });
				} else {
					try {
						const embed = this.client.util
							.embed()
							.setColor(msg.guild?.me?.displayColor || this.client.config.color)
							.setTitle(title).setDescription(stripIndents`
								This giveaway will draw **${winnerCount}** ${winnerCount === 1 ? 'winner' : 'winners'} after **${maxEntries}** ${
							maxEntries === 1 ? 'person has' : 'people have'
						} entered.

								Once **${maxEntries}** entry is reached, the lucky winner${maxEntries === 1 ? '' : 's'} will be decided!
							`);
						const mss = await channel.send('🎉 **LIMITED ENTRIES** 🎉', { embed });
						await this.client.settings.new('giveaway', {
							title,
							emoji,
							winnerCount,
							guildID: msg.guild!.id,
							channelID: channel.id,
							messageID: mss.id,
							maxEntries,
							createdBy: msg.author.id,
						});
						await mss.react(emoji);

						if (m.editable) {
							m.reactions.removeAll();
							return m.edit(`Successfully started giveaway in ${channel}.`, { embed: null });
						}
						return msg.util!.send(`Successfully started giveaway in ${channel}.`);
					} catch (err) {
						await m.edit('', { embed: null });
						const alsoM = await msg.channel.send(`An error occured when trying to start that giveaway: ${err}.`);
						return alsoM.delete({ timeout: 5000 });
					}
				}
			}
		}
		return msg;
	}
}
