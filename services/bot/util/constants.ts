/**
 * https://github.com/dirigeants/rest/blob/master/src/util/Constants.ts
 *
 * 	MIT License
 *
 *	Copyright (c) 2017-2020 dirigeants
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:
 *
 *	The above copyright notice and this permission notice shall be included in all
 *	copies or substantial portions of the Software.
 *
 *	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *	SOFTWARE.
 */
import { Options } from 'pretty-ms';
import { APIGuildUnavailable, APIUserData, APIGuildMemberData, APIEmojiPartial } from '@klasa/dapi-types';

export const Routes = {
	channel: (channelID: string): string => `/channels/${channelID}`,
	channelInvites: (channelID: string): string => `/channels/${channelID}/invites`,
	channelMessage: (channelID: string, messageID: string): string => `/channels/${channelID}/messages/${messageID}`,
	channelMessages: (channelID: string): string => `/channels/${channelID}/messages`,
	channelPermissions: (channelID: string, overwriteID: string): string =>
		`/channels/${channelID}/permissions/${overwriteID}`,
	channelPin: (channelID: string, messageID: string): string => `/channels/${channelID}/pins/${messageID}`,
	channelPins: (channelID: string): string => `/channels/${channelID}/pins`,
	channelTyping: (channelID: string): string => `/channels/${channelID}/typing`,
	channelWebhooks: (channelID: string): string => `/channels/${channelID}/webhooks`,
	crosspostMessage: (channelID: string, messageID: string): string =>
		`/channels/${channelID}/messages/${messageID}/crosspost`,
	dms: (): string => `/users/@me/channels`,
	followChannel: (channelID: string): string => `/channels/${channelID}/followers`,
	gateway: (): string => `/gateway`,
	gatewayBot: (): string => `/gateway/bot`,
	groupDMRecipient: (channelID: string, userID: string): string => `/channels/${channelID}/recipients/${userID}`,
	guild: (guildID: string): string => `/guilds/${guildID}`,
	guildAuditLog: (guildID: string): string => `/guilds/${guildID}/audit-logs`,
	guildBan: (guildID: string, userID: string): string => `/guilds/${guildID}/bans/${userID}`,
	guildBans: (guildID: string): string => `/guilds/${guildID}/bans`,
	guildChannels: (guildID: string): string => `/guilds/${guildID}/channels`,
	guildEmoji: (guildID: string, emojiID: string): string => `/guilds/${guildID}/emojis/${emojiID}`,
	guildEmojis: (guildID: string): string => `/guilds/${guildID}/emojis`,
	guildIntegration: (guildID: string, integrationID: string): string =>
		`/guilds/${guildID}/integrations/${integrationID}`,
	guildIntegrations: (guildID: string): string => `/guilds/${guildID}/integrations`,
	guildIntegrationSync: (guildID: string, integrationID: string): string =>
		`/guilds/${guildID}/integrations/${integrationID}/sync`,
	guildInvites: (guildID: string): string => `/guilds/${guildID}/invites`,
	guildMember: (guildID: string, userID: string): string => `/guilds/${guildID}/members/${userID}`,
	guildMemberNickname: (guildID: string, userID = '@me'): string => `/guilds/${guildID}/members/${userID}/nick`,
	guildMemberRole: (guildID: string, userID: string, roleID: string): string =>
		`/guilds/${guildID}/members/${userID}/roles/${roleID}`,
	guildMembers: (guildID: string): string => `/guilds/${guildID}/members`,
	guildMembersSearch: (guildID: string): string => `/guilds/${guildID}/members/search`,
	guildPreview: (guildID: string): string => `/guilds/${guildID}/preview`,
	guildPrune: (guildID: string): string => `/guilds/${guildID}/prune`,
	guildRole: (guildID: string, roleID: string): string => `/guilds/${guildID}/roles/${roleID}`,
	guildRoles: (guildID: string): string => `/guilds/${guildID}/roles`,
	guilds: (): string => `/guilds`,
	guildVanityURL: (guildID: string): string => `/guilds/${guildID}/vanity-url`,
	guildVoiceRegions: (guildID: string): string => `/guilds/${guildID}/regions`,
	guildWebhooks: (guildID: string): string => `/guilds/${guildID}/webhooks`,
	guildWidget: (guildID: string): string => `/guilds/${guildID}/widget`,
	guildWidgetImage: (guildID: string): string => `/guilds/${guildID}/widget.png`,
	invite: (inviteCode: string): string => `/invites/${inviteCode}`,
	leaveGuild: (guildID: string): string => `/users/@me/guilds/${guildID}`,
	messageReaction: (channelID: string, messageID: string, emojiID: string): string =>
		`/channels/${channelID}/messages/${messageID}/reactions/${emojiID}`,
	messageReactions: (channelID: string, messageID: string): string =>
		`/channels/${channelID}/messages/${messageID}/reactions`,
	messageReactionUser: (channelID: string, messageID: string, emojiID: string, userID = '@me'): string =>
		`/channels/${channelID}/messages/${messageID}/reactions/${emojiID}/${userID}`,
	oauthApplication: (): string => `/oauth2/applications/@me`,
	user: (userID = '@me'): string => `/users/${userID}`,
	voiceRegions: (): string => `/voice/regions`,
	webhook: (webhookID: string): string => `/webhooks/${webhookID}`,
	webhookGithub: (webhookID: string, webhookToken: string): string => `/webhooks/${webhookID}/${webhookToken}/github`,
	webhookSlack: (webhookID: string, webhookToken: string): string => `/webhooks/${webhookID}/${webhookToken}/slack`,
	webhookTokened: (webhookID: string, webhookToken: string): string => `/webhooks/${webhookID}/${webhookToken}`,
};
// https://github.com/dirigeants/ws/blob/master/src/types/InternalWebSocket.ts
export const enum WebSocketEvents {
	Ready = 'READY',
	Resumed = 'RESUMED',
	ChannelCreate = 'CHANNEL_CREATE',
	ChannelUpdate = 'CHANNEL_UPDATE',
	ChannelDelete = 'CHANNEL_DELETE',
	ChannelPinsUpdate = 'CHANNEL_PINS_UPDATE',
	GuildCreate = 'GUILD_CREATE',
	GuildUpdate = 'GUILD_UPDATE',
	GuildDelete = 'GUILD_DELETE',
	GuildBanAdd = 'GUILD_BAN_ADD',
	GuildBanRemove = 'GUILD_BAN_REMOVE',
	GuildEmojisUpdate = 'GUILD_EMOJIS_UPDATE',
	GuildIntegrationsUpdate = 'GUILD_INTEGRATIONS_UPDATE',
	GuildMemberAdd = 'GUILD_MEMBER_ADD',
	GuildMemberRemove = 'GUILD_MEMBER_REMOVE',
	GuildMemberUpdate = 'GUILD_MEMBER_UPDATE',
	GuildMembersChunk = 'GUILD_MEMBERS_CHUNK',
	GuildRoleCreate = 'GUILD_ROLE_CREATE',
	GuildRoleUpdate = 'GUILD_ROLE_UPDATE',
	GuildRoleDelete = 'GUILD_ROLE_DELETE',
	InviteCreate = 'INVITE_CREATE',
	InviteDelete = 'INVITE_DELETE',
	MessageCreate = 'MESSAGE_CREATE',
	MessageUpdate = 'MESSAGE_UPDATE',
	MessageDelete = 'MESSAGE_DELETE',
	MessageDeleteBulk = 'MESSAGE_DELETE_BULK',
	MessageReactionAdd = 'MESSAGE_REACTION_ADD',
	MessageReactionRemove = 'MESSAGE_REACTION_REMOVE',
	MessageReactionRemoveAll = 'MESSAGE_REACTION_REMOVE_ALL',
	MessageReactionRemoveEmoji = 'MESSAGE_REACTION_REMOVE_EMOJI',
	PresenceUpdate = 'PRESENCE_UPDATE',
	TypingStart = 'TYPING_START',
	UserUpdate = 'USER_UPDATE',
	VoiceStateUpdate = 'VOICE_STATE_UPDATE',
	VoiceServerUpdate = 'VOICE_SERVER_UPDATE',
	WebhooksUpdate = 'WEBHOOKS_UPDATE',
}

export interface Base {
	id: string;
}

export interface ReadyDispatch {
	v: number;
	user_settings: {};
	user: APIUserData;
	session_id: string;
	relationships: [];
	private_channels: [];
	presences: [];
	guilds: APIGuildUnavailable[];
	shard?: [number, number];
}

export interface MessageReactionAddData {
	user_id: string;
	channel_id: string;
	message_id: string;
	guild_id?: string;
	member?: APIGuildMemberData;
	emoji: APIEmojiPartial;
}

export const PRETTY_MS_SETTINGS: Options = {
	millisecondsDecimalDigits: 0,
	secondsDecimalDigits: 0,
	separateMilliseconds: true,
	verbose: true,
};
