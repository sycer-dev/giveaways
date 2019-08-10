import { Listener } from 'discord-akairo';

export default class DebugListener extends Listener {
	public constructor() {
		super('debug', {
			category: 'client',
			emitter: 'client',
			event: 'debug',
		});
	}

	public exec(event: any): void {
		this.client.logger.debug(`[DEBUG]: ${event}`);
	}
}
