import {
	AkairoClient,
	CommandHandler,
	Constants as AkairoConstants,
	InhibitorHandler,
	ListenerHandler,
} from 'discord-akairo';
import { ColorResolvable, Constants, Message, WebhookClient, Intents } from 'discord.js';
import { join } from 'path';
import { Logger } from 'winston';
import SettingsProvider from '../../database/structures/SettingsProvider';
import API from '../structures/API';
import GiveawayHandler from '../structures/GiveawayHandler';
import { Prometheus, prometheus } from '../structures/Prometheus';
import VoteHandler from '../structures/VoteHandler';
import { logger } from '../util/logger';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		config: GiveawayOpts;
		devlog: WebhookClient;
		settings: SettingsProvider;
		giveawayHandler: GiveawayHandler;
		voteHandler: VoteHandler;
		giveawayAPI?: API;
		prometheus: Prometheus;
	}
}

interface GiveawayOpts {
	token: string;
	owners: string | string[];
	color: ColorResolvable;
	prefix: string;
}

export default class GiveawayClient extends AkairoClient {
	public constructor() {
		super({
			ownerID: process.env.OWNERS!.split(','),
			ws: {
				intents: [
					Intents.FLAGS.GUILDS,
					Intents.FLAGS.GUILD_MESSAGES,
					Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
					Intents.FLAGS.GUILD_MEMBERS,
					Intents.FLAGS.GUILD_PRESENCES,
				],
			},
		});
	}

	public readonly config: GiveawayOpts = {
		token: process.env.DISCORD_TOKEN!,
		owners: process.env.OWNERS!.split(','),
		color: process.env.COLOR!,
		prefix: process.env.PREFIX!,
	};

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
			return this.config.prefix;
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3500,
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

	public prometheus = prometheus;

	public readonly settings: SettingsProvider = new SettingsProvider(this);

	private async load(): Promise<void> {
		this.voteHandler = new VoteHandler(this);
		this.giveawayAPI = new API(this);

		// @ts-ignore
		this.on('raw', () => this.prometheus.metrics.eventCounter.inc());
		this.on(Constants.Events.MESSAGE_CREATE, () => this.prometheus.metrics.messageCounter.inc());
		this.commandHandler.on(AkairoConstants.CommandHandlerEvents.COMMAND_FINISHED, () =>
			this.prometheus.metrics.commandCounter.inc(),
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
		await this.load();
		this.giveawayAPI!.init();
		await this.settings.init();
		return this.login(this.config.token);
	}
}
