import { Listener, Command, Constants } from 'discord-akairo';
import { Message, WebhookClient } from 'discord.js';

export default class CommandStartedListener extends Listener {
	public constructor() {
		super(Constants.CommandHandlerEvents.COMMAND_STARTED, {
			category: 'commandHandler',
			emitter: 'commandHandler',
			event: Constants.CommandHandlerEvents.COMMAND_STARTED,
		});
	}

	public exec(msg: Message, command: Command): void {
		if (msg.util!.parsed!.command) return;
		const where = msg.guild ? msg.guild.name : msg.author.tag;
		this.client.logger.info(`[COMMAND STARTED] ${command.id} in ${where}`);
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.addFields(
				{ name: 'Guild', value: msg.guild?.name ?? 'DMs' },
				{ name: 'Command', value: command.id },
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				{ name: 'Message Content', value: msg.content.substring(0, 200) ?? 'No message content' },
				{
					name: 'User',
					value: `${msg.author.tag} \`[${msg.author.id}]\``,
				},
			)
			.setTimestamp();
		try {
			const client = new WebhookClient(process.env.CMDLOGID!, process.env.CMDLOGTOKEN!);
			client.send({ embeds: [embed] });
		} catch (err) {
			this.client.logger.error(`[CMD LOG ERROR]: ${err}`);
		}
	}
}
