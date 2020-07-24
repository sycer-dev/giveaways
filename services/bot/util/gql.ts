import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
import fetch from 'node-fetch';

export const apolloClient = new ApolloClient({
	cache: new InMemoryCache(),
	link: new HttpLink({
		uri: process.env.GRAPHQL_URI,
		// @ts-ignore
		fetch,
	}),
});

export interface Guild {
	id: string;
	prefix: string;
	created_at: Date;
}

export interface Giveaway {
	id: number;
	title: string;
	emoji: string;
	guild_id: string;
	channel_id: string;
	message_id: string;
	created_by: string;
	winners: number;
	// TODO: this tbh
	entries: any[];
	draw_at: Date;
	created_at: Date;
}

export interface GuildInput {
	id: string;
}

export interface CreateGuildInput {
	id: string;
	prefix?: string;
}

export interface CreateGiveawayInput {
	title: string;
	emoji: string;
	guild_id: string;
	channel_id: string;
	message_id: string;
	created_by: string;
	winners: number;
	draw_at: Date;
}

export interface EntryData {
	user_id: string;
}

export interface CreateGiveawayData {
	id: number;
	title: string;
	emoji: string;
	guild_id: string;
	channel_id: string;
	message_id: string;
	created_by: string;
	winners: number;
	draw_at: Date;
	entries?: EntryData[];
}

export interface FindGiveawayArgs {
	drawn?: boolean;
	guild_id?: string;
}

export const QUERIES = {
	GUILD: gql`
		query($id: String!) {
			getGuild(id: $id) {
				id
				prefix
			}
		}
	`,
	DELETE_GUILD: gql`
		query($id: String!) {
			deleteGuild(id: $id)
		}
	`,
	GIVEAWAY: gql`
		query($message_id: String!) {
			getGiveaway(message_id: $message_id) {
				id
			}
		}
	`,
	GIVEAWAYS: gql`
		query($drawn: Boolean, $guild_id: String) {
			findGiveaway(drawn: $drawn, guild_id: $guild_id) {
				id
				drawn
				draw_at
				guild_id
				channel_id
				message_id
				winners
				entries {
					user_id
				}
			}
		}
	`,
	EXPIRE_GIVEAWAY: gql`
		query($message_id: String!) {
			expireGiveaway(message_id: $message_id) {
				id
				drawn
			}
		}
	`,
};

export const MUTATIONS = {
	CREATE_GUILD: gql`
		mutation($data: CreateGuildInput) {
			createGuild(data: $data) {
				id
				prefix
				created_at
			}
		}
	`,
	CREATE_GIVEAWAY: gql`
		mutation($data: CreateGiveawayInput) {
			createGiveaway(data: $data) {
				id
			}
		}
	`,
};
