import { Gauge, register } from 'prom-client';

export class Prometheus {
	public readonly metrics = {
		messageCounter: new Gauge({
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
		giveawayCounter: new Gauge({
			name: 'giveaway_bot_giveaways',
			help: 'Total number of giveaways Giveaway Bot has hosted.',
		}),
		activeGiveawaysCounter: new Gauge({
			name: 'giveaway_bot_active_giveaways',
			help: 'The total number of active giveaways.',
		}),
		completedGiveawaysCounter: new Gauge({
			name: 'giveaway_bot_completed_giveaways',
			help: 'The total number of completed giveaways.',
		}),
		commandCounter: new Gauge({
			name: 'giveaway_bot_commands',
			help: 'Total number of commands Giveaway Bot has ran.',
		}),
		eventCounter: new Gauge({
			name: 'giveaway_bot_gateway_events',
			help: 'Total number of events Giveawat Bot has recieved through the gateway.',
		}),
		register,
	};
}

export const prometheus = new Prometheus();
