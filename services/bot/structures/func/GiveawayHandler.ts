import { GraphQLError } from 'graphql';
import prettyms from 'pretty-ms';
import { draw } from '../../util';
import { PRETTY_MS_SETTINGS } from '../../util/constants';
import { CreateGiveawayData, CreateGiveawayInput, QUERIES } from '../../util/gql';
import Client from '../client/Client';

export default class GiveawayHandler {
	protected interval!: NodeJS.Timeout;

	private readonly _rate = 60000;

	private readonly _waiting: Set<number> = new Set();

	// eslint-disable-next-line no-useless-constructor
	public constructor(protected readonly client: Client) {}

	public async end(giveaway: CreateGiveawayData): Promise<void> {
		await this.client.apolloClient.mutate<CreateGiveawayInput, any>({
			mutation: QUERIES.EXPIRE_GIVEAWAY,
			variables: {
				message_id: giveaway.id,
			},
		});

		const channel = await this.client.util.parseChannel(giveaway.channel_id);
		const message = channel
			? await this.client.util.getMessage(channel?.id, giveaway.message_id).catch(() => undefined)
			: null;
		if (!message || !message.embeds.length) return;

		const entries = giveaway.entries!;

		const embed = this.client.util.embed(message.embeds[0]).setColor(3553599);

		const timeField = embed.fields.find(f => f.name === 'Time Remaining');
		if (timeField) {
			embed.spliceField(embed.fields.indexOf(timeField), 1);
		}

		if (!entries.length) {
			embed.setFooter('Ended at').setDescription('No winners! 😒');
			return void this.client.util.editMessage(message.channel_id, message.id, {
				content: '🎉 **GIVEAWAY ENDED** 🎉',
				embed,
			});
		}

		const winners = draw(entries, giveaway.winners);

		embed
			.setDescription(`**Winner${winners.length === 1 ? '' : 's'}**:\n ${winners.map(r => r.toString()).join('\n')}`)
			.setFooter(`${winners.length} Winner${winners.length === 1 ? '' : 's'} • Ended`)
			.setTimestamp();

		await this.client.util.editMessage(message.channel_id, message.id, { content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
		await this.client.util
			.sendMessage(message.channel_id, {
				content: `🎉 Congratulations, ${winners
					.map(u => `<@${u.user_id}>`)
					.join(', ')
					.substring(0, 1500)}! You won the giveaway for *${giveaway.title}*!`,
			})
			.catch(() => undefined);
	}

	private queue(giveaway: CreateGiveawayData): void {
		const untilFire = giveaway.draw_at.getTime() - Date.now();
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Queued ${giveaway.id}, ${prettyms(untilFire)} until draw.`);

		this._waiting.add(giveaway.id);
		setTimeout(() => {
			this.end(giveaway);
			this._waiting.delete(giveaway.id);
		}, untilFire);
	}

	private async edit(giveaway: CreateGiveawayData): Promise<void> {
		const channel = await this.client.util.parseChannel(giveaway.channel_id);
		const message = channel
			? await this.client.util.getMessage(channel?.id, giveaway.message_id).catch(() => undefined)
			: null;
		if (!message || !message.embeds.length) return;

		const embed = this.client.util.embed(message.embeds[0]);
		const field = embed.fields.find(f => f.name === 'Time Remaining');

		if (field) {
			const index = embed.fields.indexOf(field);
			if (index > -1) {
				embed.fields[index] = {
					name: 'Time Remaining',
					value: `\`${prettyms(giveaway.draw_at.getTime() - Date.now(), PRETTY_MS_SETTINGS)}\``,
					inline: false,
				};

				if (message.author.id === this.client.user?.id) {
					await this.client.util
						.editMessage(message.channel_id, message.id, { embed })
						.catch(err => void this.client.logger.debug(`[GIVEAWAY HANDLER]: Edit of ${message.id} failed - ${err}.`));
				}
			} else
				this.client.logger.verbose(`[GIVEAWAY HANDLER]: Skipped edit for Giveaway #${giveaway.id}, index is ${index}.`);
		}
	}

	private async _check(): Promise<void> {
		const {
			data: { findGiveaway: data },
			errors,
		}: {
			data: { findGiveaway: CreateGiveawayData[] };
			errors?: Readonly<GraphQLError[]>;
		} = await this.client.apolloClient.query<any, any>({
			query: QUERIES.GIVEAWAYS,
			variables: {
				drawn: false,
			},
		});
		if (errors?.length) {
			this.client.logger.error(`[GIVEAWAY HANDLER]: An error occurred when querying giveaways`);
			for (const e of errors) console.error(e);
		}

		const now = Date.now();
		if (!data.length) return;
		for (const giveaway of data.values()) {
			if (giveaway.draw_at.getTime() - now <= this._rate) this.queue(giveaway);
			else if (giveaway.draw_at.getTime() - now >= 5000) this.edit(giveaway);
			else if (!this._waiting.has(giveaway.id) && now > giveaway.draw_at.getTime()) this.end(giveaway);
		}
	}

	public async init(): Promise<void> {
		this._check();
		this.interval = setInterval(this._check.bind(this), this._rate);
		this.client.logger.info('[GIVEAWAY HANDLER] Successfully started giveaway handler.');
	}
}
