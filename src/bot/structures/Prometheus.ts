import { Gauge, register, collectDefaultMetrics, Counter } from 'prom-client';

export class Prometheus {
	public constructor() {
		collectDefaultMetrics({ prefix: 'giveaway_bot_' });
	}

	public readonly metrics = {
		messageCounter: new Counter({
			name: 'giveaway_bot_messages',
			help: 'Total number of messages Giveaway Bot has seen.',
		}),
		userCounter: new Gauge({
			name: 'giveaway_bot_users',
			help: 'Total number of all users Giveaway Bot has seen.',
		}),
		guildCounter: new Gauge({
			name: 'giveaway_bot_guilds',
			help: 'Total number of all users Giveaway Bot has seen.',
		}),
		commandCounter: new Counter({
			name: 'giveaway_bot_commands',
			help: 'Total number of commands Giveaway Bot has ran.',
		}),
		eventCounter: new Counter({
			name: 'giveaway_bot_gateway_events',
			help: 'Total number of events Giveawat Bot has recieved through the gateway.',
		}),
		register,
	};
}

export const prometheus = new Prometheus();
