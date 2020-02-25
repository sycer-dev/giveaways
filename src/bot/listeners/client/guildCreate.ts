import { Listener } from 'discord-akairo';
import { Guild, Constants } from 'discord.js';
import { stripIndents } from 'common-tags';
import moment from 'moment';
import 'moment-duration-format';

export default class GuildCreateListener extends Listener {
	public constructor() {
		super(Constants.Events.GUILD_CREATE, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.GUILD_CREATE,
		});
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
			.setColor('GREEN')
			.setTitle('Joined a Server')
			.addFields({
				name: 'Information',
				value: stripIndents`
		**Member Count**: \`${guild.memberCount}\`
		**Created**: ${createdAgo}
		**Owner**: ${owner} \`[${owner?.tag}]\`

		**Bot Count**: \`${guild.members.cache.filter(m => m.user.bot).size}\`
	  `,
			})
			.setDescription(`${guild.name} \`[${guild.id}]\``)
			.setTimestamp();
		if (guild.icon) embed.setThumbnail(guild.iconURL({ size: 2048, dynamic: true })!);

		await this.client.devlog.send({
			embeds: [embed],
			username: `${this.client.user!.username} - Guild Logs`,
			avatarURL: this.client.user!.displayAvatarURL(),
		});
	}
}
