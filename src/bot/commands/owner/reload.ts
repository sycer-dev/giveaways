import { Argument, Command, Listener } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class ReloadCommand extends Command {
	public constructor() {
		super('reload', {
			aliases: ['reload'],
			category: 'owner',
			ownerOnly: true,
			description: {
				content: 'Reloads a module.',
				usage: '<module> [type:]',
			},
			args: [
				{
					id: 'mod',
					type: Argument.union('commandAlias', 'listener'),
					prompt: {
						start: 'what command or listener would you like to reload?',
						retry: "please provide a valid command or listener that you'd like to reload.",
						optional: true,
					},
				},
				{
					id: 'all',
					match: 'flag',
					flag: ['--all'],
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ mod, all }: { mod: Command | Listener | null; all: boolean },
	): Promise<Message | Message[] | void> {
		if (all) {
			const commandHandler = this.handler;
			const listenerHandler = this.client.listenerHandler;
			try {
				await new Promise((resolve) => resolve(commandHandler.reloadAll()));
				await new Promise((resolve) => resolve(listenerHandler.reloadAll()));
				return msg.util?.reply(
					`successfully reloaded \`${commandHandler.modules.size}\` command and \`${listenerHandler.modules.size}\` listeners.`,
				);
			} catch (err) {
				// eslint-disable-next-line
				return msg.util?.reply(`failed to reload all with error: \`${err}\`.`);
			}
		}

		if (!mod) return msg.util?.reply(`please provide a valid command or listener to reload.`);

		const handler = mod instanceof Command ? this.handler : this.client.listenerHandler;

		try {
			await new Promise((resolve) => resolve(handler.reload(mod.id)));
			return msg.util?.reply(
				`successfully reloaded the \`${mod.id}\` ${mod instanceof Command ? 'command' : 'listener'}.`,
			);
		} catch (err) {
			return msg.util?.reply(
				// eslint-disable-next-line
				`failed to reload ${mod instanceof Command ? 'command' : 'listener'} ${mod.id}: \`${err}\``,
			);
		}
	}
}
