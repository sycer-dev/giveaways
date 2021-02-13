import { BaseCluster, CloseEvent, Cluster, SharderEvents, ShardingManager } from 'kurasuta';
import type GiveawayClient from '../client/GiveawayClient';
import { logger } from '../util/logger';

export default class GiveawayCluster extends BaseCluster {
	public client!: GiveawayClient;

	public launch(): void {
		this.client.launch();
	}
}

export function registerEvents(manager: ShardingManager): void {
	manager.on(SharderEvents.DEBUG, (info: string) => logger.shard(`[SHARDING MANAGER] [DEBUG]: ${info}`));
	manager.on(SharderEvents.READY, (cluster: Cluster) =>
		logger.shard(`[SHARDING MANAGER] [READY]: Cluster ${cluster.id} is ready with ${cluster.shards.length} shards.`),
	);
	manager.on(SharderEvents.SPAWN, (cluster: Cluster) =>
		logger.shard(`[SHARDING MANAGER] [SPAWNED]: Cluster ${cluster.id} has spawned.`),
	);
	manager.on(SharderEvents.SHARD_READY, (id: number) => logger.shard(`[SHARING MANAGER] Shard ${id} is ready!`));
	manager.on(SharderEvents.SHARD_DISCONNECT, (event: CloseEvent, id: number) =>
		logger.shard(`[SHARDING MANAGER]: Shard ${id} has disconnected with reason: ${event.reason} (${event.code})`),
	);
	manager.on(SharderEvents.SHARD_RECONNECT, (id: number) =>
		logger.shard(`[SHARDING MANAGER]: Shard ${id} has reconnected!`),
	);
	manager.on(SharderEvents.SHARD_RESUME, (replayed: number, id: number) =>
		logger.shard(`[SHARDING MANAGER]: Shard ${id} has reconnected and replayed ${replayed} events!`),
	);
}
