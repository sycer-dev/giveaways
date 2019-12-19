import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class ListCommand extends Command {
	public constructor() {
		super('list', {
			category: 'giveaways',
			channel: 'guild',
			aliases: ['list'],
			description: {
				content: 'Lists all ongoing giveaways.',
			},
		});
	}

	// @ts-ignore
	public userPermissions(msg: Message): string | null {
		const guild = this.client.settings!.guild.get(msg.guild!.id);
		if (msg.member!.permissions.has('MANAGE_GUILD') || (guild && msg.member!.roles.has(guild.manager))) return null;
		return 'notMaster';
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const giveaways = this.client.settings!.giveaway.filter(g => !g.complete && g.guildID === msg.guild!.id);
		if (!giveaways.size) return msg.util!.reply("sorry! I couldn't find any ongoing giveaways.");

		const gs = giveaways.array().map((g, i) => {
			const type = g.fcfs ? 'FCFS' : g.maxEntries ? 'Limited Entries' : 'Traditional';
			return `\`[${i + 1}]\` - ${type} Giveaway in ${this.client.channels.get(g.channelID) ||
				'#deleted-channel'}. [Jump](https://discordapp.com/channels/${g.guildID}/${g.channelID}/${g.messageID}/)`;
		});

		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor || this.client.config.color)
			.setAuthor('Live Giveaways', msg.guild!.iconURL() || this.client.user!.displayAvatarURL())
			.setDescription(gs.join('\n').substring(0, 1800));

		return msg.util!.send({ embed });
	}
}
