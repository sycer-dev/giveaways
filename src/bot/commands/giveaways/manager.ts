import { Command } from 'discord-akairo';
import { Message, Role, Permissions } from 'discord.js';

export default class ManagerRole extends Command {
	public constructor() {
		super('manager', {
			category: 'giveaways',
			channel: 'guild',
			aliases: ['manager', 'botmaster'],
			args: [
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What would you like to set Giveaway Manager role to?',
						retry: 'Please provide a valid role name, ID or mention.',
						optional: true,
					},
				},
				{
					id: 'off',
					flag: ['--off', '-o'],
				},
			],
			userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
			description: {
				content: 'Sets the role that allows access to Giveaway Commands.',
				usage: '[role] [--off]',
				examples: ['@Mod', 'Giveaways'],
			},
		});
	}

	public async exec(
		msg: Message,
		{ role, off }: { role: Role | null; off: boolean },
	): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		const staff = guild!.manager!;

		if (!off && !role) {
			if (staff && msg.guild!.roles.cache.get(staff))
				return msg.util?.reply(`the current Giveaway Manager role is **${msg.guild!.roles.cache.get(staff)?.name}**.`);
			if (staff) return msg.util?.reply(`the previous Giveaway Manager role was deleted. Please set a new one.`);
			return msg.util?.reply('there is no current Giveaway Manager role.');
		}

		if (off) {
			guild!.manager = null;
			await guild!.save();
			return msg.util?.reply('successfully **unset** the Giveaway Manager role.');
		}

		guild!.manager = role!.id;
		await guild!.save();
		return msg.util?.reply(`successfully set the current Giveaway Manager role to **${role!.name}**.`);
	}
}
