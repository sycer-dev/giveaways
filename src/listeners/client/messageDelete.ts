import { Listener } from 'discord-akairo';
import { Message } from 'discord.js';

export default class MessageDeleteListener extends Listener {
	public constructor() {
		super('messageDelete', {
			category: 'client',
			emitter: 'client',
			event: 'messageDelete',
		});
	}

	public exec(msg: Message): void {
		const doc = this.client.settings!.giveaway.find(g => g.messageID === msg.id && !g.complete);
		if (doc) this.client.settings!.set('giveaway', { _id: doc._id }, { complete: true });
	}
}
