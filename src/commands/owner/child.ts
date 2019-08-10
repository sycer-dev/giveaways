import { Command } from 'discord-akairo';
import { Client, Message } from 'discord.js';
import GiveawayClient from '../../classes/GiveawayClient';

export default class JSONTwitterCommand extends Command {
	public constructor() {
		super('jsontwitter', {
			ownerOnly: true,
			category: 'owner',
			aliases: ['newclient'],
			description: {
				content: 'Collects info and creates a new client.',
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'token',
					prompt: {
						start: 'Token please.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { token }: { token: string }): Promise<Message | Message[] | void> {
		const m = await msg.channel.send('Checking bot account...') as Message;
		const client = new Client();
		try {
			await client.login(token);
		} catch (err) {
			return m.edit(`An error occurred when trying to test that client: ${err}.`);
		}
		const { tag, id } = client.user!;
		const invite = await client.generateInvite(346176);
		client.destroy();

		await this.client.settings!.new('child', { id, token });

		return msg.util!.send(`Successfully created and launched 🚀 a new client for ${tag} (${id}).\nInvite link: <${invite}>`);
	}

	public async launchClient(id: string): Promise<string> {
		const doc = this.client.settings!.child.get(id)!;

		const child = new GiveawayClient({
			token: doc.token,
			color: this.client.config.color,
			owners: this.client.ownerID,
		});

		child.settings = this.client.settings;

		return child.launch();
	}
}
