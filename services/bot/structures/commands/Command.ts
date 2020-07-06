import { Permissions, PermissionsResolvable } from '../../util/Permissions';
import Module from '../core/Module';

export interface CommandOptions {
	aliases: string[];
	category: string;
	meta: CommandMeta;
	parseArgs: boolean;
	clientPermissions?: PermissionsResolvable;
	userPermissions?: PermissionsResolvable;
}

export interface CommandFlag {
	flags: string[];
	description: string;
}

export interface CommandMeta {
	description: string;
	flags?: CommandFlag[];
	examples?: string[];
	usage?: string;
}

export class Command extends Module {
	/**
	 * the aliases to register the command under
	 */
	public aliases: string[];

	/**
	 * whether or not the command has arguments and if the lexing should be performed
	 */
	public parseArgs = false;

	/**
	 * the cateogry the command falls under
	 */
	public category: string;

	/**
	 * the command cooldown
	 */
	public readonly cooldown = 3500;

	/**
	 * the command metadata such as description, examples, flags
	 */
	public meta: CommandMeta;

	/**
	 * the permissions the client requires to handle the command
	 */
	public clientPermissions?: PermissionsResolvable;

	/**
	 * the permissions the user requires to handle the command
	 */
	public userPermissions?: PermissionsResolvable;

	public constructor(
		id: string,
		{ aliases, parseArgs, category, meta, clientPermissions, userPermissions }: CommandOptions,
	) {
		super(id);

		this.aliases = aliases;
		this.parseArgs = parseArgs;
		this.category = category;
		this.meta = meta;
		this.clientPermissions = clientPermissions;
		this.userPermissions = userPermissions;
	}

	public run(...args: any[]): unknown {
		// eslint-disable-line no-unused-vars
		throw Error(`Function "run" is not implemented on command "${this.id}"`);
	}

	public static Permissions = Permissions;
}
