import { Listener } from 'discord-akairo';
import { Constants } from 'discord.js';

export default class ShardRedumedListener extends Listener {
	public constructor() {
		super(Constants.Events.SHARD_RESUME, {
			category: 'shard',
			emitter: 'shard',
			event: Constants.Events.SHARD_RESUME,
		});
	}

	public exec(shardID: number): void {
		this.client.logger.info(`[SHARD ${shardID} REDUMED]: Shard ${shardID} just resumed! Good *claps* for *claps* us.`);
	}
}
