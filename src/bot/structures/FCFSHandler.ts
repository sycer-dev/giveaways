import GiveawayClient from '../client/GiveawayClient';
import { Constants, GuildMember } from 'discord.js';

export default class FCFSHandler {
	protected readonly client: GiveawayClient;

	public constructor(client: GiveawayClient) {
		this.client = client;
	}

	private async _handleUserJoin(member: GuildMember): Promise<void> {}

	public launch(): this {
		this.client.on(Constants.Events.GUILD_MEMBER_ADD, this._handleUserJoin.bind(this));
		return this;
	}
}
