import { Listener } from 'discord-akairo';
import { Guild, WebhookClient } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';

export default class GuildCreateListener extends Listener {
	private readonly log: WebhookClient;

	public constructor() {
		super('guildCreate', {
			category: 'client',
			emitter: 'client',
			event: 'guildCreate',
		});

		this.log = new WebhookClient(process.env.LOG_ID!, process.env.LOG_TOKEN!);
	}

	public async exec(guild: Guild): Promise<void> {
		this.client.logger.info(`[NEW GUILD] Joined ${guild.name} with ${guild.memberCount} members.`);
		const existing = this.client.settings.cache.guilds.get(guild.id);
		if (!existing) this.client.settings.new('guild', { id: guild.id });

		const owner = await this.client.users.fetch(guild.ownerID).catch(() => null);
		const createdAgo = moment
			.duration(new Date().getTime() - guild.createdTimestamp)
			.format('D [days and] H [hours ago]');
		const embed = this.client.util
			.embed()
			.setColor('#90EE90')
			.setAuthor('Joined a Guild', guild.iconURL() || this.client.user!.displayAvatarURL())
			.setDescription(
				stripIndents`
				**Name**: ${guild.name}
				**ID**: \`${guild.id}\`
				**Member Count**: ${guild.memberCount}
				**Created**: ${createdAgo}
				**Owner**: ${owner!.tag} \`[${owner!.tag}]\`
          	`,
			)
			.setTimestamp();
		await this.log.send({
			embeds: [embed],
			username: `${this.client.user!.username} - Guild Logs`,
			avatarURL: this.client.user!.displayAvatarURL(),
		});
	}
}
