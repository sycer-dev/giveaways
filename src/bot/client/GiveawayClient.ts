import {
	AkairoClient,
	CommandHandler,
	InhibitorHandler,
	ListenerHandler,
	Constants as AkairoConstants,
} from 'discord-akairo';
import { ColorResolvable, Message, WebhookClient, Constants } from 'discord.js';
import { join } from 'path';
import { Gauge, register, Registry } from 'prom-client';
import { Logger } from 'winston';
import { logger } from '../util/logger';
import SettingsProvider from '../../database/structures/SettingsProvider';
import GiveawayHandler from '../structures/GiveawayHandler';
import VoteHandler from '../structures/VoteHandler';
import API from '../structures/API';

declare module 'discord-akairo' {
	interface AkairoClient {
		commandHandler: CommandHandler;
		config: GiveawayOpts;
		devlog: WebhookClient;
		giveawayAPI: API;
		giveawayHandler: GiveawayHandler;
		logger: Logger;
		prometheus: {
			messageCounter: Gauge<string>;
			userCounter: Gauge<string>;
			guildCounter: Gauge<string>;
			giveawayCounter: Gauge<string>;
			activeGiveawaysCounter: Gauge<string>;
			completedGiveawaysCounter: Gauge<string>;
			commandCounter: Gauge<string>;
			eventCounter: Gauge<string>;

			register: Registry;
		};

		settings: SettingsProvider;
		voteHandler: VoteHandler;
	}
}

interface GiveawayOpts {
	color: ColorResolvable;
	owners: string | string[];
	token: string;
}

export default class GiveawayClient extends AkairoClient {
	public constructor(config: GiveawayOpts) {
		super({
			messageCacheMaxSize: 25,
			messageCacheLifetime: 300,
			messageSweepInterval: 900,
			ownerID: config.owners,
			partials: [Constants.PartialTypes.REACTION],
		});

		this.config = config;
	}

	public readonly config: GiveawayOpts;

	public readonly devlog: WebhookClient = new WebhookClient(process.env.LOG_ID!, process.env.LOG_TOKEN!);

	public logger: Logger = logger;

	public giveawayHandler: GiveawayHandler = new GiveawayHandler(this);

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message): string => {
			if (msg.guild) {
				const req = this.settings.cache.guilds.get(msg.guild.id);
				if (req) return req.prefix;
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

	public giveawayAPI: API = new API(this);

	public readonly settings: SettingsProvider = new SettingsProvider(this);

	public readonly voteHandler: VoteHandler = new VoteHandler(this);

	private async load(): Promise<void> {
		this.on(Constants.Events.RAW, () => this.prometheus.eventCounter.inc());
		this.on(Constants.Events.MESSAGE_CREATE, () => this.prometheus.messageCounter.inc());
		this.commandHandler.on(AkairoConstants.CommandHandlerEvents.COMMAND_FINISHED, () =>
			this.prometheus.commandCounter.inc(),
		);

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
		this.giveawayAPI.init();
		await this.load();
		await this.settings.init();
		return this.login(this.config.token);
	}
}
