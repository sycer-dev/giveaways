import { scan } from 'fs-nextra';
import { extname } from 'path';
import Client from '../client/Client';
import Collection from '@discordjs/collection';
import { EventEmitter } from 'events';

import Module from './Module';

export type Modules<T> = Collection<string, T>;

export interface HandlerOptions {
	dir: string;
}

export default class Handler<T extends Module> extends EventEmitter {
	public readonly modules: Modules<T> = new Collection();

	// eslint-disable-next-line no-useless-constructor
	public constructor(protected readonly client: Client, public dir: string) {
		super();
	}

	public async walk() {
		const files = await scan(this.dir, { filter: stats => stats.isFile() && extname(stats.name) === '.js' });
		return files.keys();
	}
}
