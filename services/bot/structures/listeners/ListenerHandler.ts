import Handler from '../core/Handler';
import { EventEmitter } from 'events';
import Listener from './Listener';

export interface Emitters {
	[key: string]: EventEmitter;
}

export default class ListenerHandler extends Handler<Listener> {
	public emitters: Emitters = {};

	public handleEvent(event: string, data: any): void {
		// filter in case there are multiple
		const modules = this.modules.filter(m => m.event === event);
		for (const module of modules.values()) {
			try {
				module.run(data);
			} catch {}
		}
	}

	public async loadAll(): Promise<Map<string, Listener>> {
		const files = await this.walk();

		for (const file of files) {
			const _raw = await import(file);
			const imported = 'default' in _raw ? _raw.default : _raw;
			const listener: Listener = new imported();
			listener.client = this.client;

			this.modules.set(listener.id, listener);
		}

		return this.modules;
	}

	public setEventEmitters(data: Emitters): this {
		this.emitters = data;
		return this;
	}

	public async load() {
		for (const module of this.modules.values()) {
			const emitter = this.emitters[module.emitter];
			if (!emitter)
				throw Error(
					`[LISTENERS:UNKNOWN_EMITTER]: Recieved unknown emitter '${module.emitter}' on event '${module.event}'.`,
				);
			emitter.on(module.event, (...args) => module.run(args));
		}
	}
}
