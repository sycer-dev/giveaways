import { Gauge, register, collectDefaultMetrics } from 'prom-client';

export class Prometheus {
	public constructor() {
		collectDefaultMetrics({ prefix: 'giveaway_bot2_' });
	}

	public readonly metrics = {
		messageCounter: new Gauge({
			name: 'giveaway_bot2_messages',
			help: 'Total number of messages Giveaway Bot has seen.',
		}),
		userCounter: new Gauge({
			name: 'giveaway_bot2_users',
			help: 'Total number of all users Giveaway Bot has seen.',
		}),
		guildCounter: new Gauge({
			name: 'giveaway_bot2_guilds',
			help: 'Total number of all users Giveaway Bot has seen.',
		}),
		commandCounter: new Gauge({
			name: 'giveaway_bot2_commands',
			help: 'Total number of commands Giveaway Bot has ran.',
		}),
		eventCounter: new Gauge({
			name: 'giveaway_bot2_gateway_events',
			help: 'Total number of events Giveawat Bot has recieved through the gateway.',
		}),
		register,
	};
}

export const prometheus = new Prometheus();
