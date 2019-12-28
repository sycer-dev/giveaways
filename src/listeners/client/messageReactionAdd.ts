import { Listener } from 'discord-akairo';
import { User, MessageReaction, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import { Giveaway } from '../../models/Giveaway';

export default class MessageReactionAddListener extends Listener {
	public constructor() {
		super('messageReactionAdd', {
			category: 'client',
			emitter: 'client',
			event: 'messageReactionAdd',
		});
	}

	public async exec(reaction: MessageReaction, user: User): Promise<void> {
		const msg = reaction.message;
		if (msg.partial) await msg.fetch();
		if (!msg.guild || user.bot) return;

		const doc = this.client.settings.giveaway.find(g => g.messageID === msg.id);
		if (doc && !doc.complete && doc.maxEntries && [reaction.emoji.id, reaction.emoji.name].includes(doc.emoji))
			return this.handleMax(reaction, user, doc);
		if (!doc || doc.complete || !doc.fcfs || ![reaction.emoji.id, reaction.emoji.name].includes(doc.emoji)) return;
		const list = await reaction.users.fetch();
		const users = list.array().filter(u => u.id !== msg.author.id);
		if (doc.winnerCount > users.length) return;
		await this.client.settings.set('giveaway', { _id: doc.id }, { complete: true });

		const embed = this.client.util
			.embed()
			.setColor(msg.guild.me!.displayColor || this.client.config.color)
			.setThumbnail('https://cdn.discordapp.com/emojis/358336932343840769.png?v=1').setDescription(stripIndents`
                Drop ended!

                **Winner${doc.winnerCount === 1 ? '' : 's'}**: ${users
			.map(r => r.toString())
			.join(', ')
			.substring(0, 1800)}
            `);
		if (msg.editable) await msg.edit({ embed });
		if (msg.channel instanceof TextChannel && msg.channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES')) {
			await msg.channel.send(
				`🎉 Congratz, ${users.map(u => u.toString()).join(', ')}! You won the FCFS drop for **${doc.title}**!`,
			);
		}
	}

	public async handleMax(reaction: MessageReaction, _: User, g: Giveaway): Promise<void> {
		const msg = reaction.message;
		const list = await reaction.users.fetch();
		const users = list.array().filter(u => u.id !== msg.author.id);
		if (g.winnerCount > users.length) return;
		this.client.giveawayHandler.end(g);
	}
}
