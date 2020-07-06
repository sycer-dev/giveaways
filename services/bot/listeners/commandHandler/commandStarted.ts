import { APIMessageData } from '@klasa/dapi-types';
import { ParserOutput } from 'lexure';
import { Command } from '../../structures/commands/Command';
import { CommandHandlerEvents } from '../../structures/commands/CommandHandler';
import Listener from '../../structures/listeners/Listener';

export default class extends Listener {
	public constructor() {
		super(CommandHandlerEvents.COMMAND_RAN, {
			emitter: 'commandHandler',
			event: CommandHandlerEvents.COMMAND_RAN,
		});
	}

	public async run(msg: APIMessageData, _: ParserOutput | null, command: Command): Promise<void> {
		const where = msg.guild_id
			? await this.client.util.fetchGuild(msg.guild_id).then(g => `${g?.name} (${g?.id})`)
			: 'DMs';
		this.client.logger.verbose(
			`[COMMAND FINISHED]: '${command.category}: ${command.aliases[0]}' ${this.client.util.tag(msg.author)}, ${where}`,
		);
	}
}
