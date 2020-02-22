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
		const doc = this.client.settings.cache.giveaways.find(g => g.messageID === msg.id && !g.complete);
		if (doc) this.client.settings.set('giveaway', { _id: doc._id }, { complete: true });
	}
}
