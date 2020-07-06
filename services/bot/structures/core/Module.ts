import Client from '../client/Client';

export default class Module {
	public client!: Client;

	public fullPath!: string;

	// eslint-disable-next-line no-useless-constructor
	public constructor(public readonly id: string) {}
}
