import { Listener } from 'discord-akairo';

export default class ShardDisconnectedListener extends Listener {
	public constructor() {
		super('shardDisconnected', {
			category: 'shard',
			emitter: 'shard',
			event: 'shardDisconnected',
		});
	}

	public exec(data: any, shardID: number): void {
		this.client.logger.warn(`[SHARD ${shardID} DISCONNECTED]: Shard ${shardID} just DC'd with code ${data.code}`);
	}
}
