import { Command } from 'discord-akairo';
import { Message, PermissionResolvable } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class HelpCommand extends Command {
	public constructor() {
		super('help', {
			category: 'utilities',
			aliases: ['help'],
			description: {
				content: 'Displays all available commands or detailed info for a specific command.',
				usage: '[command]',
				examples: ['', 'ebay', 'size'],
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'command',
					type: 'commandAlias',
					prompt: {
						start: 'Which command would you like more info on?',
						retry: 'Please provide a valid command.',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { command }: { command: undefined | Command}): Promise<Message | Message[]> {
		if (!command) {
			const prefix = await msg.util!.parsed!.prefix;
			const embed = this.client.util.embed()
				.setColor(this.client.config.color!)
				.setTitle('📝 Commands')
				.setDescription(stripIndents`
					This is a list of the available commands.
                    For more info on a command, type \`${prefix}help <command>\`
                `);

			for (const category of this.handler.categories.values()) {
				if (category.id === 'owner' && !this.client.ownerID.includes(msg.author!.id)) continue;
				embed.addField(`\`🎉\` ${category.id.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`, `${category.filter(cmd => cmd.aliases.length > 0 && msg.member ? msg.member.permissions.has(cmd.userPermissions as Array<PermissionResolvable>) : true).map(cmd => `\`${cmd.aliases[0]}\`${cmd.description && cmd.description.content ? ` - ${cmd.description.content.split('\n')[0].substring(0, 120)}` : ''}`).join('\n') || 'Nothin\' to see here! '}`);
			}

			return msg.util!.send({ embed });
		}
		const embed = this.client.util.embed()
			.setColor(this.client.config.color!)
			.setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
			.addField('\`🎉\` Description', command.description.content || '\u200b');

		if (command.aliases.length > 1) embed.addField('\`🎉\` Aliases', `\`${command.aliases.join('`, `')}\``);
		if (command.description.examples && command.description.examples.length) embed.addField('\`🎉\` Examples', `\`${command.aliases[0]} ${command.description.examples.join(`\`\n\`${command.aliases[0]} `)}\``);

		return msg.util!.send({ embed });
	}
}
