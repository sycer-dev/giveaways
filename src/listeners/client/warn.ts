import { Listener } from 'discord-akairo';

export default class WarnListener extends Listener {
	public constructor() {
		super('warn', {
			category: 'client',
			emitter: 'client',
			event: 'warn',
		});
	}

	public exec(warning: any): void {
		this.client.logger.error(`[CLIENT WARNING]: ${warning}`);
	}
}
