import GiveawayClient from './GiveawayClient';
import { Giveaway } from '../models/Giveaway';
import { TextChannel, User, Message } from 'discord.js';
import prettyMS from 'pretty-ms';

export default class GiveawayHandler {
	protected client: GiveawayClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public waiting: Set<string>;

	public constructor(client: GiveawayClient, { rate = 1000 * 60 } = {}) {
		this.client = client;
		this.rate = rate;
		this.waiting = new Set();
	}

	public async end(g: Giveaway): Promise<Message | Message[] | void> {
		await this.client.settings.set('giveaway', { messageID: g.messageID }, { complete: true });

		let message: Message | undefined;
		try {
			message = await (this.client.channels.get(g.channelID) as TextChannel).messages.fetch(g.messageID);
		} catch {}
		if (!message) return;

		const reaction = message.reactions.get(g.emoji);
		if (!reaction) return;

		const users = await reaction.users.fetch();
		const list = users.array().filter(u => u.id !== message!.author.id);
		const used: string[] = [];
		if (g.boosted!.length) {
			const boosts = g.boosted!.sort((a, b) => b.entries - a.entries);
			for (const b of boosts) {
				for (const [id, m] of await message.guild!.members.fetch()) {
					if (!m.roles.has(b.string)) continue;
					if (!used.includes(id)) {
						for (let i = 0; i < b.entries; i++) list.push(m.user);
						used.push(id);
					}
				}
			}
		}

		const embed = this.client.util
			.embed()
			.setColor(3553599)
			.setTimestamp();
		if (!list.length) {
			embed.setFooter('Ended at').setDescription('No winners! 😒');
			if (message.editable) return message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
			return message;
		}

		let winners: User[] = [];
		if (list.length >= g.winnerCount) {
			while (winners.length < g.winnerCount) {
				const w = this.draw(list);
				if (!winners.includes(w)) winners.push(w);
			}
		} else {
			winners = list;
		}

		embed
			.setDescription(`**Winner${winners.length === 1 ? '' : 's'}**:\n ${winners.map(r => r.toString()).join('\n')}`)
			.setFooter(`${winners.length} Winner${winners.length === 1 ? '' : 's'} • Ended`)
			.setTimestamp();

		if (message && message.editable) await message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
		if ((message.channel as TextChannel).permissionsFor(this.client.user!)!.has('SEND_MESSAGES'))
			message.channel.send(
				`🎉 Congratz, ${winners
					.map(u => u.toString())
					.join(', ')
					.substring(0, 1500)}! You won the giveaway for *${g.title}*!`,
			);
	}

	public async edit(g: Giveaway): Promise<void> {
		let message;
		try {
			message = await (this.client.channels.get(g.channelID) as TextChannel).messages.fetch(g.messageID);
		} catch {}
		if (!message || !message.embeds.length) return;
		const embed = this.client.util.embed(message.embeds[0]);
		const field = embed.fields.find(f => f.name === 'Time Remaining');
		if (field) {
			const index = embed.fields.indexOf(field);
			embed.fields[index] = {
				name: 'Time Remaining',
				value: `\`${prettyMS(g.endsAt.getTime() - Date.now(), { verbose: true })}\``,
			};
		}
		if (message.editable) message.edit({ embed });
	}

	public shuffle(arr: User[]): User[] {
		for (let i = arr.length; i; i--) {
			const j = Math.floor(Math.random() * i);
			[arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
		}
		return arr;
	}

	public draw(list: User[]): User {
		const shuffled = this.shuffle(list);
		return shuffled[Math.floor(Math.random() * shuffled.length)];
	}

	public queue(g: Giveaway): void {
		this.waiting.add(g.messageID);
		this.client.setTimeout(() => {
			this.end(g);
			this.waiting.delete(g.messageID);
		}, g.endsAt.getTime() - Date.now());
	}

	private _check(): void {
		const giveaways = this.client.settings.giveaway.filter(g => !g.fcfs && !g.complete && !g.maxEntries);
		const now = Date.now();
		if (giveaways.size === 0) return;
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
