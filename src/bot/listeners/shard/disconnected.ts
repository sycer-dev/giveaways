import { Listener } from 'discord-akairo';
import { Constants, CloseEvent } from 'discord.js';

export default class ShardDisconnectedListener extends Listener {
	public constructor() {
		super(Constants.Events.SHARD_DISCONNECT, {
			category: 'shard',
			emitter: 'shard',
			event: Constants.Events.SHARD_DISCONNECT,
		});
	}

	public exec(data: CloseEvent, shardID: number): void {
		this.client.logger.error(`[SHARD ${shardID} DISCONNECTED]: Shard ${shardID} just DC'd with code ${data.code}.`);
	}
}
