import { stripIndents } from 'common-tags';
import { Command, version as akairoversion } from 'discord-akairo';
import { Message, Permissions, version as djsversion } from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';

export default class StatsCommand extends Command {
	public constructor() {
		super('stats', {
			aliases: ['stats', 'uptime'],
			description: {
				content: 'Provides some stats on the bot.',
			},
			category: 'utilities',
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const duration = moment.duration(this.client.uptime!).format(' D[d] H[h] m[m] s[s]');
		const ownerID = typeof this.client.ownerID === 'object' ? this.client.ownerID[0] : this.client.ownerID;
		const owner = await this.client.users.fetch(ownerID);
		const embed = this.client.util
			.embed()
			.setTitle(`${this.client.user!.username} Stats`)
			.setThumbnail(this.client.user!.displayAvatarURL())
			.addFields(
				{ name: '⏰ Uptime', value: duration },
				{ name: '💾 Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB` },
				{
					name: '📊 General Stats',
					value: stripIndents`
						• Servers: ${this.client.guilds.cache.size.toLocaleString('en-US')}
						• Channels: ${this.client.channels.cache.size.toLocaleString('en-US')}
						• Users: ${this.client.guilds.cache.reduce((prev, val) => prev + val.memberCount, 0).toLocaleString('en-US')}
					`,
				},
				{
					name: '🔢 Giveaway Stats',
					value: stripIndents`
						• Current: ${this.client.settings.cache.giveaways.filter(r => !r.complete).size}
						• Lifetime: ${this.client.settings.cache.giveaways.size}
					`,
				},
				{
					name: '`📚` Library Info',
					value: stripIndents`
							[Akairo Framework](https://discord-akairo.github.io/#/): ${akairoversion}
							[Discord.js](https://discord.js.org/#/): ${djsversion}
					`,
				},
				{ name: '👨‍💻 Lead Developer', value: `${owner.toString()} \`[${owner.tag}]\`` },
			)
			.setColor(msg.guild ? msg.guild.me!.displayColor || this.client.config.color : this.client.config.color);
		return msg.util?.send({ embed });
	}
}
