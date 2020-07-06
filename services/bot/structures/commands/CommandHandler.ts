import Handler, { Modules, HandlerOptions } from '../core/Handler';
import { Command } from './Command';
import * as Lexure from 'lexure';
import { APIMessageData } from '@klasa/dapi-types';
import Client from '../client/Client';

export enum CommandHandlerEvents {
	COMMAND_BLOCKED = 'commandBlocked',
	COMMAND_RAN = 'commandRan',
	MISSING_PERMISSIONS = 'missingPermissions',
	RATELIMIT = 'ratelimit',
}

export type PrefixSupplier = (msg: APIMessageData) => string | string[];

export type Prefix = string | string[] | PrefixSupplier;

export interface CommandHandlerOptions extends HandlerOptions {
	/**
	 * the default command cooldown in milliseconds
	 */
	cooldown?: number;

	/**
	 * the command prefix
	 */
	prefix: Prefix;
}

export default class CommandHandler extends Handler<Command> {
	/**
	 * the command prefix/supplier
	 */
	private readonly _prefix!: Prefix;

	/**
	 * the default command cooldown in ms
	 */
	public readonly cooldown: number = 3500;

	public constructor(client: Client, { cooldown, prefix, dir }: CommandHandlerOptions) {
		super(client, dir);

		if (cooldown) this.cooldown = cooldown;
		this._prefix = prefix;
	}

	public on(
		event: CommandHandlerEvents.COMMAND_RAN,
		listener: (msg: APIMessageData, args: Lexure.ParserOutput | null, command: Command) => void,
	): this;

	public on(
		event: CommandHandlerEvents.MISSING_PERMISSIONS,
		listener: (msg: APIMessageData, command: Command, level: 'user' | 'client', permissions: Permissions) => void,
	): this;

	public on(event: CommandHandlerEvents.RATELIMIT, litsener: (msg: APIMessageData, command: Command) => void): this;
	public on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	public async prefix(msg?: APIMessageData): Promise<string | string[]> {
		if (typeof this._prefix === 'function') {
			return this._prefix(msg!);
		}
		return this._prefix;
	}

	private async extractCommand(tokens: Lexure.Token[], prefix: string | string[]): Promise<Lexure.Token[]> {
		const extracted: Lexure.Token[] = [];
		if (typeof prefix === 'string') prefix = [prefix];

		for (const p of prefix) {
			const cmd = Lexure.extractCommand(s => (s.startsWith(p) ? p.length : null), tokens);
			if (cmd) extracted.push(cmd);
		}
		return extracted;
	}

	public async handle(msg: APIMessageData): Promise<void> {
		if (msg.author.bot || !msg.guild_id) return;
		const lexer = new Lexure.Lexer(msg.content).setQuotes([
			['"', '"'],
			['“', '”'],
		]);

		const prefix = await this.prefix(msg);

		const tokens = lexer.lex();
		const extracted = await this.extractCommand(tokens, prefix);
		if (!extracted.length) return;
		const commands = this.modules.filter(m =>
			m.aliases.some(a => extracted.some(e => e.value.toLowerCase() === a.toLowerCase())),
		);

		const command = commands.first();
		if (!command) return;

		const RATELIMIT_KEY = `rl.${command.id}.${msg.guild_id ?? 'DMS'}.${msg.author}`;
		const exists = await this.client.redis.get(RATELIMIT_KEY);

		// TODO: handle command ratelimit
		if (exists) {
			this.emit(CommandHandlerEvents.RATELIMIT, msg, command);
			return;
		}

		if (command.userPermissions) {
			const permissions = await this.client.util.fetchPermissions(msg.guild_id, msg.author.id);

			// TODO: handle missing permissions
			if (!permissions || !permissions.has(command.userPermissions)) {
				this.emit(CommandHandlerEvents.MISSING_PERMISSIONS, msg, command, 'user', permissions);
				return;
			}
		}

		if (command.clientPermissions) {
			const permissions = await this.client.util.fetchPermissions(msg.guild_id, this.client.user!.id);

			// TODO: handle missing permissions
			if (!permissions || !permissions.has(command.clientPermissions)) {
				this.emit(CommandHandlerEvents.MISSING_PERMISSIONS, msg, command, 'client', permissions);
				return;
			}
		}

		await this.client.redis.set(RATELIMIT_KEY, '0', 'PX', command.cooldown);

		// can just run now if no arguments are needed
		if (!command.parseArgs) {
			try {
				await command.run(msg);
			} catch (err) {
				this.client.logger.error(`[COMMAND ERROR]: ${err}`);
			} finally {
				this.emit(CommandHandlerEvents.COMMAND_RAN, msg, null, command);
			}
			return;
		}

		const parser = new Lexure.Parser(tokens).setUnorderedStrategy(Lexure.longStrategy());
		const res = parser.parse();
		const args = Lexure.outputToJSON(res);

		try {
			await command.run(msg, args);
		} catch (err) {
			this.client.logger.error(`[COMMAND ERROR]: ${err}`);
		} finally {
			this.emit(CommandHandlerEvents.COMMAND_RAN, msg, null, command);
		}
	}

	public async loadAll(): Promise<Modules<Command>> {
		const files = await this.walk();

		for (const file of files) {
			const _raw = await import(file);
			const imported = 'default' in _raw ? _raw.default : _raw;
			const command: Command = new imported();
			command.client = this.client;
			command.fullPath = file;

			// handle aliases
			for (const alias of command.aliases) {
				const conflicting = this.modules.get(alias);
				if (conflicting)
					throw Error(`[COMMAND:DUPLICATE_ALIAS] Alias "${alias}" already exists on command "${conflicting.id}"`);
				this.modules.set(command.id, command);
			}
		}

		return this.modules;
	}
}
