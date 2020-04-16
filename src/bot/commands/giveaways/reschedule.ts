import ms from '@naval-base/ms';
import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';
import prettyms from 'pretty-ms';
import { Giveaway } from '../../../database/models/Giveaway';
import { PRETTY_MS_SETTINGS } from '../../util/constants';

export default class RescheduleCommand extends Command {
	public constructor() {
		super('reschedule', {
			aliases: ['reschedule'],
			description: {
				content: 'Reschedules an ongoing giveaway.',
				usage: '<message ID> <new duration>',
				eamples: ['672848061352902688 20m'],
			},
			category: 'giveaways',
			channel: 'guild',
			args: [
				{
					id: 'giveaway',
					type: async (msg: Message, str: string): Promise<Giveaway | null> => {
						if (str) {
							const doc = await this.client.settings.get('giveaway', { messageID: str, guildID: msg.guild!.id });
							if (doc) return doc;
						}
						return null;
					},
					prompt: {
						start: "What's the message ID of the giveaway you wish to reschedule?",
						retry: 'Please provide the message ID of the giveaway you wish to reschedule.',
					},
				},
				{
					id: 'duration',
					type: (_: Message, str: string): number | null => {
						if (!str) return null;
						const duration = ms(str);
						if (duration && duration >= 3000 && !isNaN(duration)) return duration;
						return null;
					},
					prompt: {
						start: "How long until you'd like the giveaway to end? Please provide a time like `1hr` or `10m`.",
						retry: 'Pleae provide a valid duration over 3 seconds, such as `10m` or `2m`.',
					},
				},
			],
		});
	}

	// @ts-ignore
	public userPermissions(msg: Message): string | null {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		if (
			msg.member!.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			(guild && msg.member!.roles.cache.has(guild.manager))
		)
			return null;
		return 'notMaster';
	}

	public async exec(
		msg: Message,
		{ giveaway, duration }: { giveaway: Giveaway; duration: number },
	): Promise<Message | Message[] | void> {
		if (this.client.giveawayHandler.waiting.has(giveaway.messageID))
			return msg.util?.reply(`you're too late! The giveaway has already been queued!`);
		await this.client.settings.set('giveaway', { _id: giveaway._id }, { endsAt: new Date(Date.now() + duration) });
		return msg.util?.reply(
			`successfully rescheduled the giveaway in ${this.client.channels.cache.get(
				giveaway.channelID,
			)}. It will end in \`${prettyms(duration, PRETTY_MS_SETTINGS)}\`.`,
		);
	}
}
