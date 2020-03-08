import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import { Request } from 'express';
import GiveawayClient from '../client/GiveawayClient';
import { User } from 'discord.js';

export interface Vote {
	bot: User | null;
	user: User | null;
	type: 'upvote' | 'test';
	isWeekend: boolean;
	query: string;
}

export default class DBL extends EventEmitter {
	protected readonly BASE_URL = 'https://top.gg/api';

	protected readonly client: GiveawayClient;

	protected interval!: NodeJS.Timeout;

	protected readonly secret: string;

	public constructor(client: GiveawayClient, secret: string) {
		super();
		this.client = client;
		this.secret = secret;
	}

	private async _postStats(): Promise<number> {
		const request = await fetch(`${this.BASE_URL}/bots/${this.client.user?.id}/stats`, {
			method: 'POST',
			body: JSON.stringify({
				server_count: this.client.guilds.cache.size,
			}),
		});
		return request.status;
	}

	public async _handleVote(req: Request): Promise<boolean> {
		const header = req.get('Authorization');
		if (header !== this.secret) return this.emit('invalid');

		const { user, type, isWeekend, query } = req.body;
		const fetchedUser = await this.client.users.fetch(user).catch(() => null);
		return this.emit('vote', { bot: this.client.user, user: fetchedUser, type, isWeekend, query });
	}

	public on(event: 'vote' | 'test', listener: (vote: Vote) => void): this;
	public on(event: 'invalid', listener: () => void): this;
	public on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	public startVoteInterval(duration?: number): NodeJS.Timeout {
		this._postStats();
		this.interval = this.client.setInterval(this._postStats.bind(this), duration || 1000 * 60 * 15);
		return this.interval;
	}
}
