import { Argument, Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';
import { codeb } from '../../util';

export default class PrefixCommand extends Command {
	public constructor() {
		super('prefix', {
			category: 'utilities',
			aliases: ['prefix'],
			args: [
				{
					id: 'prefix',
					type: Argument.validate('string', (_, p) => !/\s/.test(p) && p.length <= 10),
					prompt: {
						start: "what would you like to update this server's prefix to?",
						retry: 'please provide a new prefix without spaces and less than 10 characters.',
						optional: true,
					},
				},
				{
					id: 'reset',
					type: 'flag',
					flag: ['--reset', '-r'],
				},
			],
			description: {
				content: 'Displays or changes the configured command prefix for this server.',
				usage: '[prefix]',
				examples: ['', '?', '>'],
				flags: [
					{
						description: 'sets the prefix to back to the default',
						flags: ['--reset', '-r'],
					},
				],
			},
		});
	}

	public async exec(
		msg: Message,
		{ prefix, reset }: { prefix: string | null; reset: boolean },
	): Promise<Message | Message[] | void> {
		const canEdit =
			!msg.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES) ||
			!(this.handler.ignorePermissions as string | string[]).includes(msg.author.id);

		if (prefix && (!canEdit || !msg.guild)) prefix = null;
		if (!prefix && reset && canEdit && msg.guild) prefix = this.client.config.prefix;

		if (!prefix) {
			const prefix = await (this.handler.prefix as PrefixSupplier)(msg);
			return msg.util?.reply(
				`the current command prefix is ${codeb(prefix)}. If you'd like to change it, please run ${codeb(
					`${prefix}prefix NewPrefixHere`,
				)}`,
			);
		}

		const guild = await this.client.settings.guild(msg.guild!.id);
		guild!.prefix = prefix;
		await guild?.save();

		return msg.util?.reply(`successfully set the prefix to ${codeb(prefix)}.`);
	}
}
