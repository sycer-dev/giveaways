import { Listener } from 'discord-akairo';
import { Constants } from 'discord.js';

export default class ErrorListener extends Listener {
	public constructor() {
		super(Constants.Events.ERROR, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.ERROR,
		});
	}

	public exec(err: any): void {
		this.client.logger.error(`[CLIENT ERROR]: ${err}`);
	}
}
