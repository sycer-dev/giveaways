import { Listener, Constants } from 'discord-akairo';
import { Message } from 'discord.js';

export default class CooldownListener extends Listener {
	public constructor() {
		super(Constants.CommandHandlerEvents.COOLDOWN, {
			category: 'commandHandler',
			emitter: 'commandHandler',
			event: Constants.CommandHandlerEvents.COOLDOWN,
		});
	}

	public exec(msg: Message, _: any, time: number): Promise<Message | Message[]> | void {
		time /= 1000;
		return msg.util?.reply(`Slow down fella 🐌! You can use that command again in \`${time.toFixed()}\` seconds.`);
	}
}
