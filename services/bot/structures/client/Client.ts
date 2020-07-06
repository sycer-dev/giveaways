import { APIUserData } from '@klasa/dapi-types';
import { Amqp } from '@spectacles/brokers';
import { REST } from '@klasa/rest';
import { join } from 'path';
import { WebSocketEvents } from '../../util/constants';
import { logger } from '../../util/logger';
import { redis } from '../../util/redis';
import CommandHandler from '../commands/CommandHandler';
import ListenerHandler from '../listeners/ListenerHandler';
import ClientUtil from './ClientUtil';

const { AMQP_URL, AMQP_GROUP, DISCORD_TOKEN, COLOR, PREFIX } = process.env;

export default class Client {
	/**
	 * the RabbitMQ broker
	 */
	public readonly broker = new Amqp(AMQP_GROUP);

	/**
	 * The default embed color
	 */
	public readonly color = Number(COLOR!);

	/**
	 * the command handler
	 */
	public readonly commandHandler: CommandHandler = new CommandHandler(this, {
		dir: join(__dirname, '..', '..', 'commands'),
		prefix: PREFIX!,
		cooldown: 3500,
	});

	/**
	 * the listener handler
	 */
	public readonly listenerHandler: ListenerHandler = new ListenerHandler(
		this,
		join(__dirname, '..', '..', 'listeners'),
	);

	/**
	 * the logger
	 */
	public readonly logger = logger;

	/**
	 * the Redis connection
	 */
	public readonly redis = redis;

	/**
	 * the discord rest interface
	 */
	public readonly rest = new REST();

	public user?: APIUserData;

	public readonly util: ClientUtil = new ClientUtil(this);

	public async launch() {
		this.rest.token = DISCORD_TOKEN!;

		// load all the commands and listeners
		this.logger.debug(`[COMMAND HANDLER]: Loading all commands...`);
		await this.commandHandler.loadAll();
		this.logger.info(`[COMMAND HANDLER]: Loaded ${this.commandHandler.modules.size} commands!`);
		await this.listenerHandler.loadAll();

		// to prevent providing the same event multiple times
		const events: Set<string> = new Set();
		// added manually for the command handler
		events.add(WebSocketEvents.MessageCreate);

		for (const listener of this.listenerHandler.modules.values()) {
			const key = listener.emitter === 'gateway' ? listener.event : `CMDHNDRL:${listener.event}`;
			events.add(key);
		}

		for (const event of events.values()) {
			if (event.startsWith('CMDHNDRL')) {
				const key = event.split('CMDHNDRL:')![1]!;
				const listener = this.listenerHandler.modules.find(m => m.event === key);
				if (listener) {
					// @ts-ignore
					this.commandHandler.on(key, (...data) => listener.run(...data));
				}
				this.logger.debug(`[COMMAND HANDLER]: Created listener for event '${key}'.`);
				continue;
			}

			this.broker.on(event, (data, { ack }) => {
				ack();
				this.listenerHandler.handleEvent(event, data);
				if (event === WebSocketEvents.MessageCreate) this.commandHandler.handle(data);
			});
			this.logger.debug(`[GATEWAY]: Created listener for event '${event}'.`);
		}

		this.broker.on('error', console.error);
		this.broker.on('close', console.error);

		// all the listeners are setup, we can connect now
		this.logger.debug(`[RABBIT]: Connecting to RabbitMQ...`);
		await this.broker.connect(AMQP_URL);
		this.logger.info(`[RABBIT]: Connected to Rabbit MQ!`);
		this.logger.debug(`[RABBIT]: Subscribing to ${events.size} events...`);
		await this.broker.subscribe(Array.from(events));
		this.logger.info(`[RABBIT]: Subscribed to ${events.size} events!`);

		this.user = await this.util.getUser('@me');
	}
}
