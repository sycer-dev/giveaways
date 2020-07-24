import { Gauge, register, Registry, collectDefaultMetrics } from 'prom-client';

type AGauge = Gauge<string>;

interface Metrics {
	messageCounter: AGauge;
	commandCounter: AGauge;
	eventCounter: AGauge;

	guildCounter?: AGauge;
	userCounter?: AGauge;

	register: Registry;
}

export class Prometheus {
	public constructor() {
		collectDefaultMetrics({ prefix: 'giveaway_bot2_' });
	}

	public readonly metrics: Metrics = {
		messageCounter: new Gauge({
			name: 'giveaway_bot2_messages',
			help: 'Total number of messages Giveaway Bot has seen.',
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
