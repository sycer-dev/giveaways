import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { Message } from 'discord.js';
import { join } from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import GiveawayHandler from './GiveawayHandler';
import { LoggerConfig } from './LoggerConfig';
import VoteHandler from './VoteHandler';
import SettingsProvider from './SettingsProvider';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		config: GiveawayOpts;
		settings: SettingsProvider;
		giveawayHandler: GiveawayHandler;
		voteHandler: VoteHandler;
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

		this.launch();
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
			if (!msg.guild) return 'g';
			const req = this.settings.guild.get(msg.guild.id);
			if (!req || !req.prefix) return 'g';
			return req.prefix;
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

	private async load(): Promise<void> {
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
