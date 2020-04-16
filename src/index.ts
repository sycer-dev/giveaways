import { Constants } from 'discord.js';
import { CloseEvent, Cluster, SharderEvents, ShardingManager } from 'kurasuta';
import { join } from 'path';
import GiveawayClient from './bot/client/GiveawayClient';
import { logger } from './bot/util/logger';

const DEV = process.env.NODE_ENV === 'dev';

const manager = new ShardingManager(join(__dirname, 'bot', 'structures', 'GiveawayCluster'), {
	client: GiveawayClient,
	clientOptions: {
		messageCacheMaxSize: 25,
		messageCacheLifetime: 300,
		messageSweepInterval: 900,
		partials: [Constants.PartialTypes.REACTION],
	},
	development: DEV,
	respawn: !DEV,
	token: process.env.DISCORD_TOKEN,
});

manager.on(SharderEvents.DEBUG, (info: string) => logger.debug(`[SHARDING MANAGER] [DEBUG]: ${info}`));
manager.on(SharderEvents.READY, (cluster: Cluster) =>
	logger.info(`[SHARDING MANAGER] [READY]: Cluster ${cluster.id} is ready with ${cluster.shards.length} shards.`),
);
manager.on(SharderEvents.SPAWN, (cluster: Cluster) =>
	logger.debug(`[SHARDING MANAGER] [SPAWNED]: Cluster ${cluster.id} has spawned.`),
);
manager.on(SharderEvents.SHARD_READY, (id: number) => logger.info(`[SHARING MANAGER] Shard ${id} is ready!`));
manager.on(SharderEvents.SHARD_DISCONNECT, (event: CloseEvent, id: number) =>
	logger.error(`[SHARDING MANAGER]: Shard ${id} has disconnected with reason: ${event.reason} (${event.code})`),
);
manager.on(SharderEvents.SHARD_RECONNECT, (id: number) =>
	logger.info(`[SHARDING MANAGER]: Shard ${id} has reconnected!`),
);
manager.on(SharderEvents.SHARD_RESUME, (replayed: number, id: number) =>
	logger.info(`[SHARDIN MANAGER]: Shard ${id} has reconnected and replayed ${replayed} events!`),
);

manager.spawn();
