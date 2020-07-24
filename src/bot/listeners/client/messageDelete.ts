import { Listener } from 'discord-akairo';
import { Message, Constants } from 'discord.js';
import { Giveaway } from '../../../database';

export default class MessageDeleteListener extends Listener {
	public constructor() {
		super(Constants.Events.MESSAGE_DELETE, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.MESSAGE_DELETE,
		});
	}

	public exec(msg: Message): void {
		Giveaway.update({ messageId: msg.id }, { drawn: true }).catch(() => undefined);
	}
}
