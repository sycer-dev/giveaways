import { Listener } from 'discord-akairo';
import { User, MessageReaction, TextChannel, Constants } from 'discord.js';
import { stripIndents } from 'common-tags';
import { Giveaway } from '../../../database';

export default class MessageReactionAddListener extends Listener {
	public constructor() {
		super(Constants.Events.MESSAGE_REACTION_ADD, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.MESSAGE_REACTION_ADD,
		});
	}

	public async exec(reaction: MessageReaction, user: User): Promise<void> {
		let msg = reaction.message;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (msg.partial) msg = await msg.fetch();
		if (!msg.guild || user.bot) return;

		const doc = await Giveaway.findOne({ messageId: msg.id });
		if (doc && !doc.drawn && doc.maxEntries && [reaction.emoji.id, reaction.emoji.name].includes(doc.emoji))
			return this.handleMax(reaction, user, doc);
		if (!doc || doc.drawn || !doc.fcfs || ![reaction.emoji.id, reaction.emoji.name].includes(doc.emoji)) return;
		const list = await reaction.users.fetch();
		const users = list.array().filter((u) => u.id !== msg.author.id);
		if (doc.winners > users.length) return;
		doc.drawn = true;
		await doc.save();

		const embed = this.client.util
			.embed()
			.setColor(msg.guild.me?.displayColor ?? this.client.config.color)
			.setThumbnail('https://cdn.discordapp.com/emojis/358336932343840769.png?v=1').setDescription(stripIndents`
                Drop ended!

                **Winner${doc.winners === 1 ? '' : 's'}**: ${users
			.map((r) => r.toString())
			.join(', ')
			.substring(0, 1800)}
            `);
		if (msg.editable) await msg.edit({ embed });
		if (msg.channel instanceof TextChannel && msg.channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES')) {
			await msg.channel.send(
				`🎉 Congratulations, ${users.map((u) => u.toString()).join(', ')}! You won the FCFS drop for **${doc.title}**!`,
			);
		}
	}

	public async handleMax(reaction: MessageReaction, _: User, g: Giveaway): Promise<void> {
		const msg = reaction.message;
		const list = await reaction.users.fetch();
		const users = list.array().filter((u) => u.id !== msg.author.id);
		if (g.maxEntries < users.length) return;
		this.client.giveawayHandler.end(g);
	}
}
