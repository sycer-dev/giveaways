import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { codeb } from '../../util';

export default class PingCommand extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping', 'latency', 'test'],
			description: {
				content: "Checks the bot's ping to Discord.",
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const message = await msg.channel.send('Ping?');
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);
		const content = `Pong! (API: ${codeb(`${ping}ms`)} - Gateway: ${codeb(`${this.client.ws.ping}ms`)})`;
		return message.edit(content).catch(() => msg.channel.send(content));
	}
}
