import Listener from '../../structures/listeners/Listener';
import { WebSocketEvents } from '../../util/constants';
import { APIGuildUnavailable } from '@klasa/dapi-types';

export default class extends Listener {
	public constructor() {
		super(WebSocketEvents.GuildDelete, {
			emitter: 'gateway',
			event: WebSocketEvents.GuildDelete,
		});
	}

	public run(guild: APIGuildUnavailable): void {
		this.client.logger.verbose(`[GUILD DELETE]: Recieved packet for guild ${guild.id}; bai!`);
		this.client.redis.del(`guild.${guild.id}`);
	}
}
