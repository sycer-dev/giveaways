import { Listener, Command } from 'discord-akairo';
import { Message, WebhookClient } from 'discord.js';

export default class CommandStartedListener extends Listener {
	public constructor() {
		super('commandStarted', {
			category: 'commandHandler',
			emitter: 'commandHandler',
			event: 'commandStarted',
		});
	}

	public exec(msg: Message, command: Command): void {
		if (msg.util!.parsed!.command) return;
		const where = msg.guild ? msg.guild.name : msg.author.tag;
		this.client.logger.info(`[COMMAND STARTED] ${command.id} in ${where}`);
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.addField('Guild', msg.guild ? msg.guild.name : 'DMs')
			.addField('Command', command.id)
			.addField('Message Content', msg.content ? msg.content.substring(0, 200) : 'No message content')
			.addField('User', `${msg.author.tag} \`[${msg.author.id}]\``)
			.setTimestamp();
		try {
			const client = new WebhookClient(process.env.CMDLOGID!, process.env.CMDLOGTOKEN!);
			client.send({ embeds: [embed] });
		} catch (err) {
			this.client.logger.error(`[CMD LOG ERROR]: ${err}`);
		}
	}
}
