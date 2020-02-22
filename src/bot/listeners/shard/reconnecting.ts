import { Listener } from 'discord-akairo';
import { Constants } from 'discord.js';

export default class ShardReconnectingListener extends Listener {
	public constructor() {
		super(Constants.Events.SHARD_RECONNECTING, {
			category: 'shard',
			emitter: 'shard',
			event: Constants.Events.SHARD_RECONNECTING,
		});
	}

	public exec(shardID: number): void {
		this.client.logger.warn(`[SHARD ${shardID} RECONNECTING]: Shard ${shardID} is reconnecting!`);
	}
}
