import { Listener } from 'discord-akairo';

export default class ShardReconnectingListener extends Listener {
	public constructor() {
		super('shardReconnecting', {
			category: 'shard',
			emitter: 'shard',
			event: 'shardReconnecting',
		});
	}

	public exec(shardID: number): void {
		this.client.logger.warn(`[SHARD ${shardID} RECONNECTING]: Shard ${shardID} is reconnecting!`);
	}
}
