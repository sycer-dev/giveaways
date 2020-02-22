import { Listener } from 'discord-akairo';
import { Constants } from 'discord.js';

export default class WarnListener extends Listener {
	public constructor() {
		super(Constants.Events.WARN, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.WARN,
		});
	}

	public exec(warning: any): void {
		this.client.logger.error(`[CLIENT WARNING]: ${warning}`);
	}
}
