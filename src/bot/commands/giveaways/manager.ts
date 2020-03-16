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

	public async exec(msg: Message, { role, off }: { role: Role; off: boolean }): Promise<Message | Message[] | void> {
		if (!off && !role) {
			const staff = this.client.settings.cache.guilds.get(msg.guild!.id)?.manager;
			if (staff && msg.guild!.roles.cache.get(staff))
				return msg.util?.send(`The current Giveaway Manager role is **${msg.guild!.roles.cache.get(staff)?.name}**.`);
			if (staff) return msg.util?.send(`The previous Giveaway Manager role was deleted. Please set a new one.`);
			return msg.util?.send('There is no current Giveaway Manager role.');
		}

		if (off) {
			await this.client.settings.set('guild', { id: msg.guild!.id }, { manager: undefined });
			return msg.util?.reply('successfully **removed** the Giveaway Manager role.');
		}

		await this.client.settings.set('guild', { id: msg.guild!.id }, { manager: role.id });
		return msg.util?.reply(`successfully set the current Giveaway Manager role to **${role.name}**.`);
	}
}
