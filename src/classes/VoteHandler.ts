const DBL = require('new-dblapi'); // eslint-disable-line
import { Guild } from '../models/Guild';
import { Snowflake, Message, Guild as DiscordGuild, WebhookClient } from 'discord.js';
import { stripIndents } from 'common-tags';
import GiveawayClient from './GiveawayClient';

export interface DBLVote {
	bot: Snowflake;
	user: Snowflake;
	type: 'upvote' | 'test';
	isWeekend: boolean;
	query?: string;
}

export default class VoteHandler {
	protected client: GiveawayClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public constructor(client: GiveawayClient, { rate = 1000 * 60 } = {}) {
		this.client = client;
		this.rate = rate;
	}

	private async _vote(vote: DBLVote): Promise<Message | Message[] | void> {
		const user = await this.client.users.fetch(vote.user).catch(() => null);
		this.client.logger.info(`[VOTE MANAGER] [NEW VOTE]: New vote from ${user ? user.tag : 'Unknown#0000'}!`);
		let theGuild: DiscordGuild;
		if (!user) return;
		const guilds = this.client.guilds
			.filter((g): boolean => {
				const m = g.members.get(user.id);
				if (m && m.permissions.has('MANAGE_GUILD')) return true;
				return false;
			})
			.array();

		if (guilds.length > 1) {
			try {
				const embed = this.client.util
					.embed()
					.setColor(this.client.config.color)
					.setTitle('Thank for your vote!').setDescription(stripIndents`
						Looks like I'm in more than one server with you of which you have the \`Manage Guild\` permission.
						
						Which server would you like premium in?

						${guilds
							.map((g, i) => `\`[${i + 1}]\` ${g.name}`)
							.join('\n')
							.substring(0, 1500)}
					`);
				const message = await user.send({ embed });
				const collector = await message.channel.awaitMessages(
					(m: Message): boolean =>
						user.id === m.author.id && Number(m.content) > 0 && Number(m.content) <= guilds.length,
					{
						max: 1,
					},
				);
				const collected = collector.first()!.content;
				const index = parseInt(collected, 10) - 1;
				theGuild = guilds[index];

				await this.client.settings.set(
					'guild',
					{ id: theGuild.id },
					{ premium: true, expiresAt: new Date(Date.now() + 8.64e7) },
				);

				await message.channel.send(`Successfully granted premium in **${theGuild.name}** for 24 hours.`);
			} catch {
				theGuild = guilds[Math.floor(Math.random() * guilds.length)];
				await this.client.settings.set(
					'guild',
					{ id: theGuild.id },
					{ premium: true, expiresAt: new Date(Date.now() + 8.64e7) },
				);
				await user.send(`Successfully granted premium in **${theGuild.name}** for 24 hours.`).catch(() => undefined);
			}
		} else if (guilds.length === 1) {
			theGuild = guilds[0];
			const embed = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setTitle('Thank for your vote!')
				.setDescription(`You've been given premium in **${theGuild.name}** for 24 hours.`);
			await this.client.settings.set(
				'guild',
				{ id: theGuild.id },
				{ premium: true, expiresAt: new Date(Date.now() + 8.64e7) },
			);
			await user.send({ embed });
		} else {
			const embed = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setTitle('Thank for your vote!')
				.setDescription(
					"Looks like we're not in any mutual servers where you have the `Manage Guild` permission. Therefore, you haven't recieved any premium benifits.",
				);
			await user.send({ embed });
		}
		const log = new WebhookClient(process.env.VOTE_ID as string, process.env.VOTE_TOKEN as string);
		if (log) {
			const embed = this.client.util
				.embed()
				.setAuthor(`${this.client.user!.username} Vote Logs`, this.client.user!.displayAvatarURL())
				.setColor(this.client.config.color)
				.setDescription(
					`📥 New vote: **@${user.tag}** \`[${user.id}]\`${
						guilds.length >= 1 ? `\n\nActivated premium in ${theGuild!.name}` : ''
					}`,
				)
				.setTimestamp();
			return log
				.send({
					embeds: [embed],
					avatarURL: this.client.user!.displayAvatarURL(),
					username: `${this.client.user!.username}'s Vote Logs`,
				})
				.catch(() => undefined);
		}
	}

	public async expire(guild: Guild): Promise<void> {
		const g = this.client.guilds.get(guild.id);
		if (g) {
			this.client.logger.info(`[MUTE MANAGER] [EXPIRY]: ${g.name} just expired!`);
			this.client.settings.set('guild', { id: guild.id }, { premium: false });
			try {
				const owner = await this.client.users.fetch(g.ownerID);
				await owner.send(
					`Oh no! Your premium benifits in **${g?.name}** has expired! You can vote again by running \`gvote\`!`,
				);
			} catch (err) {
				this.client.logger.info(`[MUTE MANAGER] [EXPIRY DM]: ${err}`);
			}
		}
	}

	public async init() {
		this._check();
		this.interval = this.client.setInterval(this._check.bind(this), this.rate);

		const manager = new DBL(
			process.env.DBL_TOKEN,
			{
				port: 5329,
				auth: process.env.DBL_SIGNATURE,
			},
			this.client,
		);

		manager.on('vote', (vote: DBLVote) => this._vote(vote));
	}

	private _check(): void {
		const guilds = this.client.settings.guild;
		const now = Date.now();
		this.client.logger.info(`[VOTE MANAGER] Checking ${guilds.size} guilds for votes.`);
		for (const g of guilds.values()) {
			if (!g.premium || !g.expiresAt) continue;
			if (now > g.expiresAt.getTime()) this.expire(g);
		}
	}
}
