import { APIEmbedData, APIGuildData, APIGuildMemberData, APIMessageData, APIUserData } from '@klasa/dapi-types';
import { Routes } from '../../util/constants';
import { Embed } from '../../util/embed';
import { Permissions } from '../../util/Permissions';
import Client from './Client';

// https://github.com/dirigeants/core/blob/master/src/lib/caching/structures/messages/MessageBuilder.ts
export interface MessageData {
	content?: string | null;
	embed?: APIEmbedData | null;
	nonce?: number | string;
	tts?: boolean;
	allowed_mentions?: Required<AllowedMentions>;
}

// https://github.com/dirigeants/core/blob/master/src/lib/caching/structures/messages/MessageBuilder.ts
export interface AllowedMentions {
	parse?: ('users' | 'roles' | 'everyone')[];
	roles?: string[];
	users?: string[];
}

export default class ClientUtil {
	public routes = Routes;

	// eslint-disable-next-line no-useless-constructor
	public constructor(protected readonly client: Client) {}

	private get rest() {
		return this.client.rest;
	}

	public stringToJson<T>(data: string): T | null {
		try {
			return JSON.parse(data) as T;
		} catch {}

		return null;
	}

	public embed(data?: APIEmbedData) {
		return new Embed(data);
	}

	public tag(user: Partial<APIUserData> & { username: string; discriminator: string }): string {
		return `${user.username}#${user.discriminator}`;
	}

	public async sendMessage(channelId: string, data: MessageData): Promise<APIMessageData> {
		const res = await this.rest.post(this.routes.channelMessages(channelId), { data });
		return res as APIMessageData;
	}

	public async editMessage(channelId: string, messageId: string, data: MessageData): Promise<APIMessageData> {
		const res = await this.rest.patch(this.routes.channelMessage(channelId, messageId), { data });
		return res as APIMessageData;
	}

	public async getGuild(Id: string): Promise<APIGuildData> {
		const query = new URLSearchParams();
		query.set('with_counts', 'true');

		const res = await this.rest.get(`${this.routes.guild(Id)}?${query}`);
		return res as APIGuildData;
	}

	public async fetchGuild(guildId: string): Promise<APIGuildData | null> {
		// try fetching from redis first
		const cached = await this.client.redis.get(`guild.${guildId}`);
		if (cached) {
			try {
				return JSON.parse(cached) as APIGuildData;
			} catch {}
		}

		// hit the API for the guild
		try {
			return this.getGuild(guildId);
		} catch {}

		return null;
	}

	public async getMember(guildId: string, memberId: string): Promise<APIGuildMemberData> {
		const res = await this.rest.get(`${this.routes.guildMember(guildId, memberId)}`);
		return res as APIGuildMemberData;
	}

	public async fetchMember(guildId: string, memberId: string): Promise<APIGuildMemberData | null> {
		// try fetching from redis first
		const cached = await this.client.redis.get(`member.${guildId}.${memberId}`);
		if (cached) {
			try {
				return JSON.parse(cached) as APIGuildMemberData;
			} catch {}
		}

		// hit the API for the guild
		try {
			return this.getMember(guildId, memberId);
		} catch {}

		return null;
	}

	public async getUser(Id: string): Promise<APIUserData> {
		return (await this.rest.get(Routes.user(Id))) as APIUserData;
	}

	public async fetchPermissions(guildId: string, memberId: string, force = false): Promise<Permissions | null> {
		// try fetching from redis first
		if (!force) {
			const cached = await this.client.redis.get(`permissions.${guildId}.${memberId}`);
			if (cached) {
				const parsed = parseInt(cached, 10);
				if (!isNaN(parsed)) return new Permissions(parsed).freeze();
			}
		}

		const guild = await this.fetchGuild(guildId);
		const member = await this.fetchMember(guildId, memberId);

		if (guild && member) {
			const roles = member.roles.map(id => guild.roles.find(r => r.id === id)!);
			const permissions = new Permissions(roles.map(r => r.permissions));

			await this.client.redis.set(`permissions.${guildId}.${memberId}`, permissions.bitfield.toString());
			return permissions;
		}

		return null;
	}
}
