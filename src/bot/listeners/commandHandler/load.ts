import { Listener, Command } from 'discord-akairo';

export default class CommandLoadedListener extends Listener {
	public constructor() {
		super('cmdloaded', {
			category: 'commandHandler',
			emitter: 'commandHandler',
			event: 'load',
		});
	}

	public exec(cmd: Command): void {
		this.client.logger.debug(`[COMMAND HANDLER] [${cmd.category.id.toUpperCase()}] Loaded ${cmd.id}.ts`);
	}
}
