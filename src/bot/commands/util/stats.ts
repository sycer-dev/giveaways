import { stripIndents } from 'common-tags';
import { Command, version as akairoVersion } from 'discord-akairo';
import { Message, version as djsVersion } from 'discord.js';
import os from 'os';
import prettyMS from 'pretty-ms';
import { codeb, localize } from '../../util';

export default class StatsCommand extends Command {
	public constructor() {
		super('stats', {
			aliases: ['stats'],
			description: {
				content: 'Provides statistics relating to the bot.',
			},
			category: 'utilities',
		});
	}

	private readonly ms = (value: number, verbose = true) => prettyMS(value, { secondsDecimalDigits: 0, verbose });

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const guildCount = (await this.client.shard?.fetchClientValues('guilds.cache.size')) as number[];
		const guilds = guildCount.reduce((acc, val) => (acc += val), 0);

		const channelCount = (await this.client.shard?.fetchClientValues('channels.cache.size')) as number[];
		const channels = channelCount.reduce((acc, val) => (acc += val), 0);

		const userCount = (await this.client.shard?.broadcastEval(
			'this.guilds.cache.reduce((prev, { memberCount }) => (prev + memberCount), 0)',
		)) as number[];
		const users = userCount.reduce((acc, val) => (acc += val), 0);

		const osmem = os.totalmem() - os.freemem();
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor ?? this.client.config.color)
			.setThumbnail(this.client.user!.displayAvatarURL({ size: 2048, dynamic: true }))
			.setTitle(`${this.client.user?.username}'s Statistics`)
			.setFooter(`On Shard #${this.client.shard?.id || 0}`)
			.addField(
				'Discord Data',
				stripIndents`
				• Guilds: ${codeb(localize(guilds))}
					• This Shard: ${codeb(localize(this.client.guilds.cache.size))}
				• Channels: ${codeb(localize(channels))}
					• This Shard: ${codeb(localize(this.client.channels.cache.size))}
				• Users: ${codeb(localize(users))}
					• This Shard: ${codeb(localize(this.client.guilds.cache.reduce((x, { memberCount }) => (x += memberCount), 0)))}
			`,
			)
			.addField(
				'Uptime',
				stripIndents`
				• Host: ${this.ms(os.uptime())} (${codeb(os.hostname())})
				• Client: ${this.ms(this.client.uptime!)}
			`,
			)
			.addField(
				'Server Usage',
				stripIndents`
				• Process Memory: ${codeb(`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`)}
				• OS Memory: ${codeb(`${(osmem / 1024 / 1024).toFixed(2)}MB`)} (${codeb(
					`${(process.memoryUsage().heapUsed / osmem).toFixed(3)}%`,
				)})
			`,
			)
			.addField(
				'Core Dependencies',
				stripIndents`
				• [Discord.js](https://discord.js/org) (Discord API Library): ${codeb(`v${djsVersion}`)}
				• [Discord Akairo](https://discord-akairo.github.io/) (Command Framework): ${codeb(`v${akairoVersion}`)}
			`,
			);

		return msg.util?.send({ embed });
	}
}
