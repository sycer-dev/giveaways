import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

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
		const starters = [
			'Ping?',
			'ooh! I love that game!',
			':b:ing?!',
			'Ping?',
			'¿Silbido?',
			'Who, me?',
			'Are you talking to me?',
			'Did you say something?',
			'Polling...',
			'Pinging...',
			'Did you even see this message?',
			"Don't look at me that way!",
			'imag was here',
		];
		const first = starters[Math.floor(Math.random() * starters.length)];

		const message = await msg.channel.send(first);
		const responses = [
			'If you say so... `$(ping) ms`',
			'Whatever. `$(ping) ms`',
			'Sure thing! `$(ping) ms`',
			'Ugh. Fine. `$(ping) ms`',
			'Do I have a choice? `$(ping) ms`',
			'Gah! Why do you make me do this? `$(ping) ms`',
			'Magic 8 ball says try again later. 🔮',
			"What's the point of this? `$(ping) ms`",
			"Hmmm. I'd have to guess around `$(ping) ms`.",
			'Maybe later.',
			'Ugh! Not now!',
			'k `$(ping) ms`',
			'nah',
		];

		let text = responses[Math.floor(Math.random() * responses.length)];
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);

		text = text.replace('$(ping)', `${ping}`);

		return message.edit(text);
	}
}
