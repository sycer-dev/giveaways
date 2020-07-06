import { APIMessageData } from '@klasa/dapi-types';
import { stripIndents } from 'common-tags';
import { Args, ParserOutput } from 'lexure';
import { Command } from '../../structures/commands/Command';
import { groupBy } from '../../util';
import { PermissionsFlags } from '../../util/Permissions';

export default class extends Command {
	public constructor() {
		super('help', {
			aliases: ['help', 'commands'],
			parseArgs: true,
			category: 'utilities',
			meta: {
				description: 'Responds with more information on the provided command or category.',
				usage: '[command/category]',
				examples: ['ping', 'utilities'],
			},
			clientPermissions: [PermissionsFlags.SendMessages, PermissionsFlags.EmbedLinks],
		});
	}

	public async run(msg: APIMessageData, res: ParserOutput): Promise<void> {
		const args = new Args(res);
		const mod = args.single();
		const { prefix, modules: _mods } = this.client.commandHandler;

		// if they provide an alias or category
		if (mod) {
			const modules = _mods.filter(c => c.category.toLowerCase().includes(mod.toLowerCase()));
			// if they provided a valid category and commands were found
			if (modules.size) {
				const name = modules.first()!.category.replace(/(\b\w)/gi, lc => lc.toUpperCase());
				const embed = this.client.util
					.embed()
					.setColor(this.client.color)
					.setTitle(name).setDescription(stripIndents`
						This is a list of all commands within the \`${name}\` category.
						For more info on a command, type \`${prefix}help <command>\`
					`);
				const data = modules.map(m => `\`${prefix}${m.aliases[0]}\` - ${m.meta.description}`).join('\n');
				embed.addField('Commands', data);

				return void this.client.util.sendMessage(msg.channel_id, { embed });
			}

			const command = modules.find(m => m.aliases.some(a => a.toLowerCase() === mod.toLowerCase()));
			// if a command was found with their search constraint
			if (command) {
				const embed = this.client.util
					.embed()
					.setTitle(`\`${prefix}${command.aliases[0]} ${command.meta.usage ?? ''}\``)
					.addField('Description', command.meta.description || '\u200b');

				if (command.aliases.length > 1) embed.addField('Aliases', `\`${command.aliases.join('`, `')}\``);
				if (command.meta.examples && command.meta.examples.length)
					embed.addField(
						'Examples',
						`\`${prefix}${command.aliases[0]} ${command.meta.examples
							.map(e => `${prefix}${command.aliases[0]}${e}`)
							.join('\n')}\``,
					);

				return void this.client.util.sendMessage(msg.channel_id, { embed });
			}

			return void this.client.util.sendMessage(msg.channel_id, {
				content: `Invalid category name or command alias '${mod.substring(0, 16)}' provided.`,
			});
		}
		// if no argument is provided at all
		const embed = this.client.util
			.embed()
			.setColor(this.client.color)
			.setTitle(`Commands (${_mods.size})`).setDescription(stripIndents`
				This is a list of the available categories and commands.
				For more info on category or command, run \`${prefix}help <category/command>\`
			`);
		const categories = groupBy(this.client.commandHandler.modules, c => c.category);
		for (const [name, cmds] of categories) {
			const commands = cmds
				.filter(c => c.aliases.length > 0)
				.map(cmd => `\`${cmd.aliases[0]}\``)
				.join(', ');
			embed.addField(`${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())} (${cmds.size})`, commands);
		}

		return void this.client.util.sendMessage(msg.channel_id, { embed });
	}
}
