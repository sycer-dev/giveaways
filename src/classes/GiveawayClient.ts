import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { Message } from 'discord.js';
import { join } from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import GiveawayHandler from './GiveawayHandler';
import { LoggerConfig } from './LoggerConfig';
import VoteHandler from './VoteHandler';
import SettingsProvider from './SettingsProvider';
import { register, Gauge } from 'prom-client';
import { createServer, Server } from 'http';
import { parse } from 'url';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		config: GiveawayOpts;
		settings: SettingsProvider;
		giveawayHandler: GiveawayHandler;
		voteHandler: VoteHandler;
		prometheus: {
			messageCounter: Gauge;
			userCounter: Gauge;
			guildCounter: Gauge;
			giveawayCounter: Gauge;
			completedGiveawaysCounter: Gauge;
			activeGiveawaysCounter: Gauge;
			commandCounter: Gauge;
			eventCounter: Gauge;
		};

		promServer: Server;
	}
}

interface GiveawayOpts {
	token: string;
	owners: string | string[];
	color: number;
}

export default class GiveawayClient extends AkairoClient {
	public constructor(config: GiveawayOpts) {
		super({
			messageCacheMaxSize: 10,
			ownerID: config.owners,
			disabledEvents: ['TYPING_START'],
			partials: ['MESSAGE'],
		});

		this.config = config;

		this.listenerHandler.on('load', i =>
			this.logger.debug(`[LISTENER HANDLER] [${i.category.id.toUpperCase()}] Loaded ${i.id} listener!`),
		);
	}

	public config: GiveawayOpts;

	public logger: Logger = createLogger({
		levels: LoggerConfig.levels,
		format: format.combine(
			format.colorize({ level: true }),
			format.errors({ stack: true }),
			format.splat(),
			format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
			format.printf((data: any) => {
				const { timestamp, level, message, ...rest } = data;
				return `[${timestamp}] ${level}: ${message}${
					Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
				}`;
			}),
		),
		transports: new transports.Console(),
		level: 'custom',
	});

	public giveawayHandler: GiveawayHandler = new GiveawayHandler(this);

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message): string => {
			if (msg.guild) {
				const req = this.settings.guild.get(msg.guild.id);
				return req?.prefix!;
			}
			return 'g';
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) =>
					`${msg.author} \`🎁\` ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) =>
					`${msg.author} \`🎁\` ${str}\n... or type \`cancel\` to cancel this command.`,
				timeout: 'You took too long. Command cancelled.',
				ended: 'You took more than 3 tries! Command canclled',
				cancel: 'Sure thing, command cancelled.',
				retries: 3,
				time: 60000,
			},
			otherwise: '',
		},
	});

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
	});

	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
	});

	public prometheus = {
		messageCounter: new Gauge({
			name: 'giveaway_bot_messages',
			help: 'Total number of messages Giveaway Bot has seen.',
		}),
		userCounter: new Gauge({
			name: 'giveaway_bot_users',
			help: 'Histogram of all users Giveaway Bot has seen.',
		}),
		guildCounter: new Gauge({
			name: 'giveaway_bot_guilds',
			help: 'Histogram of all users Giveaway Bot has seen.',
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
			name: 'giveaway_bot_completed giveaways',
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

	public promServer = createServer((req, res): void => {
		if (parse(req.url!).pathname === '/metrics') {
			res.writeHead(200, { 'Content-Type': this.prometheus.register.contentType });
			res.write(this.prometheus.register.metrics());
		}
		res.end();
	});

	private async load(): Promise<void> {
		this.on('message', () => this.prometheus.messageCounter.inc());
		this.on('raw', () => this.prometheus.eventCounter.inc());
		this.commandHandler.on('commandFinished', () => this.prometheus.commandCounter.inc());

		this.voteHandler = new VoteHandler(this);
		this.settings = new SettingsProvider(this);

		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
			shard: this,
		});

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
	}

	public async launch(): Promise<string> {
		await this.load();
		await this.settings.init();
		return this.login(this.config.token);
	}
}
