import Listener from '../../structures/listeners/Listener';
import { WebSocketEvents, ReadyDispatch } from '../../util/constants';

export default class extends Listener {
	public constructor() {
		super(WebSocketEvents.Ready, {
			emitter: 'gateway',
			event: WebSocketEvents.Ready,
		});
	}

	public run(data: ReadyDispatch): void {
		this.client.logger.info(
			`[READY]: ${this.client.util.tag(data.user)} is ready to serve ${data.guilds.length} guilds!`,
		);
	}
}
