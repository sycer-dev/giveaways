import Module from '../core/Module';

export type Emitter = 'gateway' | 'commandHandler';

export interface ListenerOptions {
	event: string;
	emitter: Emitter;
}

export default class Listener extends Module {
	public readonly emitter: Emitter = 'gateway';

	public readonly event: string;

	public constructor(id: string, { emitter, event }: ListenerOptions) {
		super(id);

		this.emitter = emitter;
		this.event = event;
	}

	public run(...args: any[]): unknown | Promise<unknown> {
		// eslint-disable-line no-unused-vars
		throw Error(`Function "run" is not implemented on listener "${this.id}"`);
	}
}
