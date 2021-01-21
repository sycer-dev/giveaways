import ms from '@naval-base/ms';
import { ColorResolvable, Message, MessageReaction, Snowflake, TextChannel, User } from 'discord.js';
import prettyms from 'pretty-ms';
import { In } from 'typeorm';
import { Giveaway } from '../../database';
import GiveawayClient from '../client/GiveawayClient';
import { draw } from '../util';
import { GiveawayType, PRETTY_MS_SETTINGS } from '../util/constants';

interface FetchReactionUsersOptions {
	limit?: number;
	after?: Snowflake;
	before?: Snowflake;
}

export default class GiveawayHandler {
	protected client: GiveawayClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public readonly waiting: Set<number> = new Set();

	public constructor(client: GiveawayClient, { rate = 1000 * 90 } = {}) {
		this.client = client;
		this.rate = rate;
	}

	private async fetchUsers(reaction: MessageReaction, after?: string): Promise<User[]> {
		const opts: FetchReactionUsersOptions = { limit: 100, after };
		const reactions = await reaction.users.fetch(opts);
		if (!reactions.size) return [];

		const last = reactions.last()?.id;
		const next = await this.fetchUsers(reaction, last);
		return reactions.array().concat(next);
	}

	public async pullWinners(reaction: MessageReaction, winners: number): Promise<User[]> {
		const _users = await this.fetchUsers(reaction);
		const list = _users.filter((u) => u.id !== this.client.user!.id);

		return draw(list, winners);
	}

	public async end(g: Giveaway): Promise<Message | Message[] | void> {
		this.waiting.delete(g.id);
		g.drawn = true;
		await g.save();

		const channel = this.client.channels.cache.get(g.channelId);
		const message = await (channel as TextChannel | null)?.messages.fetch(g.messageId).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const reaction = await message.reactions.cache
			.get(g.emoji)
			?.fetch()
			.catch(() => undefined);
		if (!reaction) return;

		const _users =
			reaction.count! <= 100
				? await reaction.users.fetch({ limit: 100 }).then((x) => x.array())
				: await this.fetchUsers(reaction);
		// const _members = await message.guild!.members.fetch();
		const list = _users.filter((u) => u.id !== message.author.id);

		// const used: string[] = [];
		// if (g.boosted.length) {
		// 	const boosts = g.boosted.sort((a, b) => b.entries - a.entries);
		// 	for (const b of boosts) {
		// 		for (const [id, m] of _members) {
		// 			if (!m.roles.cache.has(b.string)) continue;
		// 			if (!used.includes(id)) {
		// 				// start i as 1 to account for the initial entry from L32
		// 				for (let i = 1; i < b.entries; i++) list.push(m.user);
		// 				used.push(id);
		// 			}
		// 		}
		// 	}
		// }

		const embed = this.client.util.embed().setColor(3553599).setTimestamp().setTitle(message.embeds[0].title);

		if (!list.length) {
			embed.setFooter('Ended at').setDescription('No winners! 😒');
			if (message.editable) return message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
			return message;
		}

		const winners = draw(list, g.winners);
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Drew giveaway #${g.id}.`);

		embed
			.setDescription(`**Winner${winners.length === 1 ? '' : 's'}**:\n ${winners.map((r) => r.toString()).join('\n')}`)
			.setFooter(`${winners.length} Winner${winners.length === 1 ? '' : 's'} • Ended`)
			.setTimestamp();

		if (message.editable) await message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
		if ((message.channel as TextChannel).permissionsFor(this.client.user!)!.has('SEND_MESSAGES'))
			message.channel.send(
				`🎉 Congratulations, ${winners
					.map((u) => u.toString())
					.join(', ')
					.substring(0, 1500)}! You won the giveaway for *${g.title}*!`,
			);
	}

	private async edit(g: Giveaway, color?: ColorResolvable): Promise<void> {
		const channel = await this.client.channels.fetch(g.channelId).catch(() => undefined);
		const message = await (channel as TextChannel).messages.fetch(g.messageId).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const embed = this.client.util.embed(message.embeds[0]);
		const field = embed.fields.find((f) => f.name === 'Time Remaining');

		if (color) {
			embed.setColor(color);
			message.edit({ embed }).catch(() => undefined);
		} else if (field) {
			const index = embed.fields.indexOf(field);
			if (index > -1) {
				embed.spliceFields(index, 1, {
					name: 'Time Remaining',
					value: `\`${prettyms(g.drawAt.getTime() - Date.now(), PRETTY_MS_SETTINGS)}\``,
					inline: false,
				});
				if (message.editable) {
					await message
						.edit({ embed })
						.catch(
							(err) => void this.client.logger.debug(`[GIVEAWAY HANDLER]: Edit of ${message.id} failed - ${err}.`),
						);
				}
			} else this.client.logger.verbose(`[GIVEAWAY HANDLER]: Skipped edit for #${g.id}, index is ${index}.`);
		}
	}

	private queue(g: Giveaway): void {
		const untilFire = g.drawAt.getTime() - Date.now();
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Queued #${g.id}, ${ms(untilFire)} until draw.`);
		this.waiting.add(g.id);
		this.client.setTimeout(() => {
			this.end(g);
		}, untilFire);
	}

	private async _check(): Promise<void> {
		const guildId = In(this.client.guilds.cache.keyArray());
		const giveaways = await Giveaway.find({
			type: GiveawayType.TRADITIONAL,
			drawn: false,
			guildId,
		});

		const now = Date.now();
		if (!giveaways.length) return;
		for (const giveaway of giveaways.values()) {
			const drawAt = giveaway.drawAt.getTime();
			if (drawAt - now <= this.rate) this.queue(giveaway);
			else if (drawAt - now >= 5000) this.edit(giveaway);
			else if (!this.waiting.has(giveaway.id) && now > drawAt) this.end(giveaway);
		}
	}

	public init(): void {
		this._check();
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.interval = this.client.setInterval(this._check.bind(this), this.rate);
		this.client.logger.info('[GIVEAWAY HANDLER] Successfully started giveaway handler.');
	}
}
