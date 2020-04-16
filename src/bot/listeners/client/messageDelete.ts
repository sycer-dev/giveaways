import { Listener } from 'discord-akairo';
import { Message, Constants } from 'discord.js';

export default class MessageDeleteListener extends Listener {
	public constructor() {
		super(Constants.Events.MESSAGE_DELETE, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.MESSAGE_DELETE,
		});
	}

	public exec(msg: Message): void {
		this.client.settings.set('giveaway', { messageID: msg.id }, { complete: true });
	}
}
