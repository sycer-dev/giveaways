import { APIMessageData } from '@klasa/dapi-types';
import ms from '@naval-base/ms';
import { stripIndents } from 'common-tags';
import { GraphQLError } from 'graphql';
import { Args, ParserOutput } from 'lexure';
import prettyms from 'pretty-ms';
import { Command } from '../../structures/commands/Command';
import { PRETTY_MS_SETTINGS } from '../../util/constants';
import { CreateGiveawayInput, MUTATIONS } from '../../util/gql';
import { PermissionsFlags } from '../../util/Permissions';

export default class extends Command {
	public constructor() {
		super('create', {
			aliases: ['create', 'new', 'start'],
			parseArgs: true,
			category: 'giveaways',
			meta: {
				description: 'Creates a new giveaway.',
				usage: '<channel> <winners> <duration> <name>',
				examples: ['#giveaways 1 15m Discord Nitro!'],
			},
			clientPermissions: [PermissionsFlags.SendMessages, PermissionsFlags.EmbedLinks],
			userPermissions: [PermissionsFlags.ManageMessages],
		});
	}

	public async run(msg: APIMessageData, res: ParserOutput): Promise<APIMessageData | void> {
		const args = new Args(res);

		const _channel = args.single();
		const channel = _channel ? await this.client.util.parseChannel(_channel) : null;
		const prefix = await this.client.commandHandler.prefix(msg);
		if (!channel)
			return this.client.util.sendMessage(msg.channel_id, {
				content: stripIndents`
				Invalid first argument for \`channel\`.
				For usage information, please run \`${prefix}help create\`.
			`,
			});

		const _winners = args.single();
		const winners = _winners ? parseInt(_winners, 10) : null;
		if (!winners || isNaN(winners))
			return this.client.util.sendMessage(msg.channel_id, {
				content: stripIndents`
				Invalid second argument for \`winners\`.
				For usage information, please run \`${prefix}help create\`.
			`,
			});
		if (winners <= 0) return this.client.util.sendMessage(msg.channel_id, { content: 'There cannot be `0` winners.' });
		if (winners > 100)
			return this.client.util.sendMessage(msg.channel_id, { content: 'There cannot be more than `100` winners.' });

		const _duration = args.single();
		const duration = _duration ? ms(_duration) : null;
		if (!duration || isNaN(duration))
			return this.client.util.sendMessage(msg.channel_id, {
				content: stripIndents`
				Invalid third argument for \`duration\`.
				For usage information, please run \`${prefix}help create\`.
			`,
			});
		if (duration <= 1000 * 5)
			return this.client.util.sendMessage(msg.channel_id, {
				content: 'A giveaway cannot last for less than 5 seconds.',
			});

		const next = args.many();
		const title = next.map(t => t.value).join(' ');

		const embed = this.client.util
			.embed()
			.setColor(this.client.color)
			.setTitle(`🎉 ${title} 🎉`)
			.setFooter(`${winners} Winner${winners === 1 ? '' : 's'} • Ends at`)
			.setTimestamp(new Date(Date.now() + duration))
			.setDescription(`React with 🎉 to enter!`)
			.addField('Time Remaining', `\`${prettyms(duration, PRETTY_MS_SETTINGS) || '.'}\``)
			.addField('Host', `<@${msg.author.id}> [\`${this.client.util.tag(msg.author)}\`]`);

		const m = await this.client.util.sendMessage(channel.id, { embed });

		try {
			await this.client.apolloClient.mutate<{ data: CreateGiveawayInput }, any>({
				mutation: MUTATIONS.CREATE_GIVEAWAY,
				variables: {
					data: {
						title,
						emoji: '🎉',
						guild_id: msg.guild_id!,
						channel_id: msg.channel_id,
						message_id: m.id,
						created_by: msg.author.id,
						winners,
						draw_at: new Date(Date.now() + duration),
					},
				},
			});
		} catch (err) {
			console.error(err);
			return this.client.util.sendMessage(msg.channel_id, {
				content: `An error occurred when creating a database entry: \`${err}\`.`,
			});
		}

		await this.client.util.createReaction(msg.channel_id, msg.id, '🎉');

		return this.client.util.sendMessage(msg.channel_id, {
			content: `Successfully created a message in <#${channel.id}>.`,
		});
	}
}
