import Listener from '../../structures/listeners/Listener';
import { WebSocketEvents } from '../../util/constants';
import { APIGuildData } from '@klasa/dapi-types';
import gql from 'graphql-tag';
import { GraphQLError } from 'graphql';
import { QUERIES, Guild, GuildInput, MUTATIONS } from '../../util/gql';

export default class extends Listener {
	public constructor() {
		super(WebSocketEvents.GuildCreate, {
			emitter: 'gateway',
			event: WebSocketEvents.GuildCreate,
		});
	}

	public async run(guild: APIGuildData): Promise<void> {
		this.client.logger.verbose(
			`[GUILD CREATE]: Recieved packet for guild ${guild.id}; available? ${!guild.unavailable}`,
		);
		this.client.redis.set(`guild.${guild.id}`, JSON.stringify(guild));

		const { errors }: { data: { getGuild: Guild }, errors?: Readonly<GraphQLError[]> } = await this.client.apolloClient.query<any, GuildInput>({
			query: QUERIES.GUILD,
			variables: {
				id: guild.id,
			},
		});

		// the element was not found so we create it!
		if (errors?.length) {
			const { errors: errs }: { errors?: Readonly<GraphQLError[]> } = await this.client.apolloClient.mutate<any, GuildInput>({
				mutation: MUTATIONS.CREATE_GUILD,
				variables: {
					id: guild.id,
				},
			});

			// an error occurred when creating the mutation
			if (errs?.length) {
				for (const err of errs) {
					this.client.logger.error(`[GRAPHQL]: ${err}`, err);
				}
			}
			
			return;
		}
	}
}
