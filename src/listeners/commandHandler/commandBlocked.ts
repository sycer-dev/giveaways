import { Listener, Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';

export interface Text {
	[key: string]: string;
}

export default class CommandBlockedListener extends Listener {
	public constructor() {
		super('commandBlocked', {
			category: 'commandHandler',
			event: 'commandBlocked',
			emitter: 'commandHandler',
		});
	}

	public async exec(msg: Message, command: Command, reason: string): Promise<void> {
		if (reason === 'sendMessages') return;

		const text: Text = {
			owner: 'You must be the owner to use this command.',
			guild: 'You must be in a guild to use this command.',
			dm: 'Yhis command must be ran in DMs.',
		};

		const location = msg.guild ? msg.guild.name : msg.author.tag;
		this.client.logger.info(`[COMMANDS BLOCKED] ${command.id} with reason ${reason} in ${location}`);

		const res = text[reason];
		if (!res) return;

		if (
			msg.guild
				? msg.channel instanceof TextChannel && msg.channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES')
				: true
		) {
			msg.util!.reply(res);
		}
	}
}
