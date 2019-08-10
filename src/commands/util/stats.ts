import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';
import * as moment from 'moment';
import 'moment-duration-format';

export default class StatsCommand extends Command {
	public constructor() {
		super('stats', {
			aliases: ['stats', 'uptime'],
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Provides some stats on the bot.',
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const duration = moment.duration(this.client.uptime!).format(' D[d] H[h] m[m] s[s]');
		const ownerID = typeof this.client.ownerID === 'object' ? this.client.ownerID[0] : this.client.ownerID;
		const owner = await this.client.users.fetch(ownerID);
		const embed = this.client.util.embed()
			.setTitle(`${this.client.user!.username} Stats`)
			.setThumbnail(this.client.user!.displayAvatarURL())
			.addField('`⏰` Uptime', duration, true)
			.addField('`💾`Memory Usage', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, true)
			.addField('`📊` General Stats', stripIndents`
                        • Servers: ${this.client.guilds.size.toLocaleString('en-US')}
                        • Channels: ${this.client.channels.size.toLocaleString('en-US')}
                        • Users: ${this.client.guilds.reduce((prev, val) => prev + val.memberCount, 0).toLocaleString('en-US')}
			`, true)
			.addField('`🔢` Giveaway Stats', stripIndents`
				• Current: ${this.client.settings!.giveaway.filter(r => !r.complete).size}
				• Lifetime: ${this.client.settings!.giveaway.size}
			`, true)
			.addField('`📚` Library Info', stripIndents`
                    [\`Akairo Framework\`](https://discord-akairo.github.io/#/): ${require('discord-akairo').version}
                    [\`Discord.js\`](https://discord.js.org/#/): ${require('discord.js').version}
        	`, true)
			.addField('\`👨‍\` Lead Developer', `${owner.toString()} \`[${owner.tag}]\``, true)
			.setColor(msg.guild ? msg.guild!.me!.displayColor || this.client.config.color! : this.client.config.color!);
		return msg.util!.send({ embed });
	}
}

