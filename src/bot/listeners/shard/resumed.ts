import { Listener } from 'discord-akairo';

export default class ShardRedumedListener extends Listener {
	public constructor() {
		super('shardResumed', {
			category: 'shard',
			emitter: 'shard',
			event: 'shardResumed',
		});
	}

	public exec(shardID: number): void {
		this.client.logger.warn(`[SHARD ${shardID} REDUMED]: Shard ${shardID} just resumed! Good *claps* for *claps* us.`);
	}
}
