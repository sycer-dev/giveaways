import Listener from '../../structures/listeners/Listener';
import { WebSocketEvents } from '../../util/constants';
import { APIGuildData } from '@klasa/dapi-types';

export default class extends Listener {
	public constructor() {
		super(WebSocketEvents.GuildCreate, {
			emitter: 'gateway',
			event: WebSocketEvents.GuildCreate,
		});
	}

	public run(guild: APIGuildData): void {
		this.client.logger.verbose(
			`[GUILD CREATE]: Recieved packet for guild ${guild.id}; available? ${!guild.unavailable}`,
		);
		this.client.redis.set(`guild.${guild.id}`, JSON.stringify(guild));
	}
}
