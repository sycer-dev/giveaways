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
	protected readonly client: GiveawayClient;
	protected readonly BASE_URL = 'https://top.gg/api';
	protected interval!: NodeJS.Timeout;
	protected readonly signature: string = process.env.DBL_SIGNATURE!;
	protected readonly token: string = process.env.DBL_TOKEN!;

	public constructor(client: GiveawayClient) {
		super();
		this.client = client;
	}

	private async _postStats(): Promise<number> {
		const request = await fetch(`${this.BASE_URL}/bots/${this.client.user?.id}/stats`, {
			method: 'POST',
			body: JSON.stringify({
				server_count: this.client.guilds.cache.size,
			}),
			headers: { Authorization: this.token },
		});
		return request.status;
	}

	public async _handleVote(req: Request): Promise<boolean> {
		const header = req.get('Authorization');
		const signature = process.env.DBL_SIGNATURE!;
		if (header !== signature) return super.emit('invalid');

		const { user, type, isWeekend, query } = req.body;
		const fetchedUser = await this.client.users.fetch(user).catch(() => null);
		const emitted = super.emit('vote', { bot: this.client.user, user: fetchedUser, type, isWeekend, query });
		this.client.logger.verbose(`[HANDLE VOTE]: Emitted ${emitted}.`);
		return emitted;
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
