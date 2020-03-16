import GiveawayClient from '../client/GiveawayClient';
import { Giveaway } from '../../database/models/Giveaway';
import { TextChannel, Message, ColorResolvable, User, Snowflake } from 'discord.js';
import ms from '@naval-base/ms';
import prettyms from 'pretty-ms';
import { draw } from '../util';
import { EMOJIS, PRETTY_MS_SETTINGS } from '../util/constants';

interface FetchReactionUsersOptions {
	limit: number;
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

	public async end(g: Giveaway): Promise<Message | Message[] | void> {
		await this.client.settings.set('giveaway', { messageID: g.messageID }, { complete: true });

		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const reaction = message.reactions.cache.get(g.emoji);
		if (!reaction) return;

		const _users: User[] = [];
		let after = undefined;
		while (true) {
			const opts: FetchReactionUsersOptions = { limit: 100, after };
			const _u = await reaction.users.fetch(opts);
			if (_u.size) {
				after = _u.first()!.id;
				for (const user of _u.values()) _users.push(user);
			} else break;
		}
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

	public makeEmojiString(dur: number): string {
		const str = ms(dur, true);
		let buffer = '';
		for (const char of str) {
			if (isNaN(parseInt(char, 10))) buffer += char;
			buffer += this.client.emojis.cache.get(EMOJIS[char])?.toString();
		}
		const anotherBuffer: string[] = [];
		for (const word of buffer.split(' ')) {
			if (['second', 'seconds', 'sec', 's'].includes(word)) {
				anotherBuffer[anotherBuffer.length - 1] = this.client.emojis.cache.get(EMOJIS.countdown)!.toString();
			}
			anotherBuffer.push(word);
		}
		return anotherBuffer.join(' ');
	}

	private async edit(g: Giveaway, color?: ColorResolvable): Promise<void> {
		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const embed = this.client.util.embed(message.embeds[0]);
		const field = embed.fields.find(f => f.name === 'Time Remaining');

		if (color) {
			embed.setColor(color);
			message.edit({ embed }).catch(() => undefined);
		} else if (field) {
			const index = embed.fields.indexOf(field);
			if (index > -1) {
				embed.spliceFields(index, 1, {
					name: 'Time Remaining',
					value: `\`${prettyms(g.endsAt.getTime() - Date.now(), PRETTY_MS_SETTINGS)}\``,
					inline: false,
				});
				if (message.editable) message.edit({ embed }).catch(() => undefined);
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

	private _check(): void {
		const giveaways = this.client.settings.cache.giveaways.filter(g => !g.fcfs && !g.complete && !g.maxEntries);
		const now = Date.now();
		if (!giveaways.size) return;
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
