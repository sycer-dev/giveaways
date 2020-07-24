import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class GuideCommand extends Command {
	public constructor() {
		super('guide', {
			aliases: ['info', 'about', 'guide'],
			description: {
				content: 'Returns a guide explaining how to use the bot.',
			},
			category: 'utilities',
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const prefix = await (this.handler.prefix as PrefixSupplier)(msg);
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.addFields(
				{
					name: 'Setup',
					value: stripIndents`
						Hello, and thank you for using **${this.client.user!.username}**!

						Before you're able to start a giveaway, you **must** have either \`Manage Guild\` or the Giveaway master role to start a giveaway. 
					`,
				},
				{
					name: 'Starting a Giveaway',
					value: stripIndents`
						Before you start, please ensure I have \`Send Messages\`, \`Embed Links\` and \`Add Reactions\` in the channel you want to run the giveawy in.

						${this.client.user!.username} offers 3 diffent types of giveaways.

						\`[1]\` Traditional - Your traditional giveaway. Simply provide a channel, winner count, duration, and title and you're good to go.
						\`[2]\` First Come, First Serve - As the name states, the first *n* people to react are the automatic winners.
						\`[3]\` Limited Entries - A Traditional giveaway that ends when time's up or the entry maximum is reached.

						To create a giveaway, it's as simple as \`${prefix}create number-from-above\`. For example, \`${prefix}create 2\`.

						Although the reaction-based giveaway builder is cool, it can be time consuming. You can use the \`quick\` command if you're seeking to make a type-1 giveaway. 
					`,
				},
				{
					name: 'Other',
					value: stripIndents`
						Get stuck? Come visit our [Support Server](https://fyko.net/discord) to get help!

						Want to invite **${
							this.client.user!.username
						}** to your server? You can invite it with [this](${await this.client.generateInvite(346176)}) link!
					`,
				},
			);

		return msg.util?.send({ embed });
	}
}
