import { Listener } from 'discord-akairo';
import { Constants } from 'discord.js';

export default class DebugListener extends Listener {
	public constructor() {
		super(Constants.Events.DEBUG, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.DEBUG,
		});
	}

	public exec(info: string): void {
		this.client.logger.debug(`[DEBUG]: ${info}`);
	}
}
