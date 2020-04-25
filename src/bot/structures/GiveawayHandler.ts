import ms from '@naval-base/ms';
import { ColorResolvable, Message, MessageReaction, Snowflake, TextChannel, User } from 'discord.js';
import prettyms from 'pretty-ms';
import GiveawayModel, { Giveaway } from '../../database/models/Giveaway';
import GiveawayClient from '../client/GiveawayClient';
import { draw } from '../util';
import { PRETTY_MS_SETTINGS } from '../util/constants';

interface FetchReactionUsersOptions {
	limit?: number;
	after?: Snowflake;
	before?: Snowflake;
}

export default class GiveawayHandler {
	protected client: GiveawayClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public waiting: Set<string> = new Set();

	public constructor(client: GiveawayClient, { rate = 1000 * 30 } = {}) {
		this.client = client;
		this.rate = rate;
	}

	private async fetchUsers(reaction: MessageReaction, after?: string): Promise<User[]> {
		const opts: FetchReactionUsersOptions = { limit: 100, after };
		const reactions = await reaction.users.fetch(opts);
		if (!reactions.size) return [];

		const last = reactions.first()?.id;
		const next = await this.fetchUsers(reaction, last);
		return reactions.array().concat(next);
	}

	public async end(g: Giveaway): Promise<Message | Message[] | void> {
		await this.client.settings.setById('giveaway', g._id, { complete: true });
		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const reaction = message.reactions.cache.get(g.emoji);
		if (!reaction) return;

		const _users = await this.fetchUsers(reaction);
		const _members = await message.guild!.members.fetch();
		const list = _users.filter(u => u.id !== message.author.id);

		const used: string[] = [];
		if (g.boosted?.length) {
			const boosts = g.boosted.sort((a, b) => b.entries - a.entries);
			for (const b of boosts) {
				for (const [id, m] of _members) {
					if (!m.roles.cache.has(b.string)) continue;
					if (!used.includes(id)) {
						// start i as 1 to account for the initial entry from L32
						for (let i = 1; i < b.entries; i++) list.push(m.user);
						used.push(id);
					}
				}
			}
		}

		const embed = this.client.util
			.embed()
			.setColor(3553599)
			.setTimestamp()
			.setTitle(message.embeds[0].title);

		if (!list.length) {
			embed.setFooter('Ended at').setDescription('No winners! 😒');
			if (message.editable) return message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
			return message;
		}

		const winners = draw(list, g.winnerCount);
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Drew giveaway ${g._id}.`);

		embed
			.setDescription(`**Winner${winners.length === 1 ? '' : 's'}**:\n ${winners.map(r => r.toString()).join('\n')}`)
			.setFooter(`${winners.length} Winner${winners.length === 1 ? '' : 's'} • Ended`)
			.setTimestamp();

		if (message && message.editable) await message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
		if ((message.channel as TextChannel).permissionsFor(this.client.user!)!.has('SEND_MESSAGES'))
			message.channel.send(
				`🎉 Congratulations, ${winners
					.map(u => u.toString())
					.join(', ')
					.substring(0, 1500)}! You won the giveaway for *${g.title}*!`,
			);
	}

	private async edit(g: Giveaway, color?: ColorResolvable): Promise<void> {
		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		this.client.logger.debug(
			`[GIVEAWAY HANDLER]: Fetched ${g._id} - ${message?.id} - Has ${message?.embeds.length} embeds.`,
		);
		if (!message || !message.embeds.length) return;

		const embed = this.client.util.embed(message.embeds[0]);
		const field = embed.fields.find(f => f.name === 'Time Remaining');

		if (color) {
			this.client.logger.debug(`[GIVEAWAY HANDLER]: Editing ${g._id}'s color.`);
			embed.setColor(color);
			message.edit({ embed }).catch(() => undefined);
		} else if (field) {
			const index = embed.fields.indexOf(field);
			this.client.logger.debug(`[GIVEAWAY HANDLER]: Field index of ${g._id} - ${index}.`);
			if (index > -1) {
				embed.spliceFields(index, 1, {
					name: 'Time Remaining',
					value: `\`${prettyms(g.endsAt.getTime() - Date.now(), PRETTY_MS_SETTINGS)}\``,
					inline: false,
				});
				if (message.editable) {
					const msg = await message
						.edit({ embed })
						.catch(err => void this.client.logger.debug(`[GIVEAWAY HANDLER]: Edit of ${g._id} failed - ${err}.`));
					this.client.logger.debug(`[GIVEAWAY HANDLER]: Edited ${g._id} - ID: ${msg?.id}.`);
				}
			} else this.client.logger.verbose(`[GIVEAWAY HANDLER]: Skipped edit for ${g._id}, index is ${index}.`);
		}
	}

	private queue(g: Giveaway): void {
		const untilFire = g.endsAt.getTime() - Date.now();
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Queued ${g._id}, ${ms(untilFire)} until draw.`);
		this.waiting.add(g.messageID);
		this.client.setTimeout(() => {
			this.end(g);
			this.waiting.delete(g.messageID);
		}, untilFire);
	}

	private async _check(): Promise<void> {
		const $in = this.client.guilds.cache.keyArray();
		const giveaways = await GiveawayModel.find({
			fcfs: false,
			complete: false,
			maxEntries: undefined,
			guildID: { $in },
		});

		const now = Date.now();
		if (!giveaways.length) return;
		for (const g of giveaways.values()) {
			if (g.endsAt.getTime() - now <= this.rate) this.queue(g);
			if (g.endsAt.getTime() - now >= 5000) this.edit(g);
			if (!this.waiting.has(g.messageID) && now > g.endsAt.getTime()) this.end(g);
		}
	}

	public async init(): Promise<void> {
		this._check();
		this.interval = this.client.setInterval(this._check.bind(this), this.rate);
		this.client.logger.info('[GIVEAWAY HANDLER] Successfully started giveaway handler.');
	}
}
