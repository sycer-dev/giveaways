import { Listener } from 'discord-akairo';

export default class ErrorListener extends Listener {
	public constructor() {
		super('err', {
			category: 'client',
			emitter: 'client',
			event: 'error',
		});
	}

	public exec(err: any): void {
		this.client.logger.error(`[CLIENT ERROR]: ${err}`);
	}
}
