import { Argument, Category, Command, PrefixSupplier } from 'discord-akairo';
import { Message } from 'discord.js';
import { codeb, smartChunk } from '../../util';
import { stripIndents } from 'common-tags';
import { Flag } from '../../util/constants';

export default class HelpCommand extends Command {
	public constructor() {
		super('help', {
			category: 'utilities',
			aliases: ['help', 'commands'],
			description: {
				content: 'Displays all available commands or more info on a specified category or channel.',
				usage: '[command]',
				examples: ['', 'config', 'new'],
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'arg',
					type: Argument.union('commandAlias', (_: Message, str: string): null | Category<string, Command> => {
						if (str) return this.handler.categories.get(str.toLowerCase()) ?? null;
						return null;
					}),
					prompt: {
						start: 'which category or command would you like more info on?',
						retry: "please provide a valid category or command you'd like more information on.",
						optional: true,
					},
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ arg }: { arg: undefined | Command | Category<string, Command> },
	): Promise<Message | Message[] | void> {
		const prefix = await (this.handler.prefix as PrefixSupplier)(msg);

		if (!arg) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
				.setTitle('📝 Commands').setDescription(stripIndents`
				This is a list of the available categories and commands.
				For more info on category or command, type \`${prefix}help <category/command>\`

				\`<>\`: required parameter - \`[]\`: optional parameter
			`);

			for (const category of this.handler.categories.values()) {
				if (category.id === 'owner' && !this.client.ownerID.includes(msg.author.id)) continue;
				const commands = category
					.filter((c) => c.aliases.length > 0)
					.map((cmd) => `\`${cmd.aliases[0]}\``)
					.join(', ');
				embed.addField(`${category.id.replace(/(\b\w)/gi, (lc) => lc.toUpperCase())}`, commands);
			}

			return msg.util?.send({ embed });
		}
		if (arg instanceof Command) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
				.setTitle(codeb(`${arg.aliases[0]}${arg.description.usage ? ` ${arg.description.usage}` : ''}`))
				.addField('Description', arg.description.content ?? 'No description.');

			if (arg.aliases.length > 1) embed.addField('Aliases', arg.aliases.map((a) => codeb(a)).join(', '));
			if (arg.description.flags)
				embed.addField(
					'Flags',
					arg.description.flags.map(
						({ description, flags }: Flag) => `${flags.map((f) => codeb(f)).join(', ')}: ${description}`,
					),
				);
			if ((arg.description.examples as string[] | undefined)?.length)
				embed.addField(
					'Examples',
					arg.description.examples.map((e: string) => codeb(`${prefix}${arg.aliases[0]} ${e}`)).join('\n'),
				);

			return msg.util?.send({ embed });
		}

		const name = arg.id.replace(/(\b\w)/gi, (lc) => lc.toUpperCase());
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.setTitle(name).setDescription(stripIndents`
			This is a list of all commands within the \`${name}\` category.
			For more info on a command, type \`${prefix}help <command>\`.
		`);
		const data = arg
			.array()
			.filter((c) => c.aliases.length > 0)
			.map(
				(cmd) =>
					`\`${cmd.aliases[0]}\` - ${
						cmd.description?.content ? cmd.description.content.split('\n')[0] : 'No description.'
					}`,
			);
		const chunks = smartChunk(data, 1024);
		for (const [index, chunk] of chunks.entries())
			embed.addField(index ? 'Commands Cont.' : 'Commands', chunk.join('\n'));

		return msg.util?.send({ embed });
	}
}
