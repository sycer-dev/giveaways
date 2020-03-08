import { Listener } from 'discord-akairo';
import { Guild, Constants } from 'discord.js';
import { stripIndents } from 'common-tags';
import ms from '@naval-base/ms';

export default class GuildDeleteListener extends Listener {
	public constructor() {
		super(Constants.Events.GUILD_DELETE, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.GUILD_DELETE,
		});
	}

	public async exec(guild: Guild): Promise<void> {
		this.client.logger.verbose(`[LEFT GUILD] Left ${guild.name} with ${guild.memberCount} members.`);
		if (!guild.available) return;

		const owner = await this.client.users.fetch(guild.ownerID).catch(() => null);
		const durationJoined = Date.now() - guild?.me?.joinedAt?.getTime()!;
		const embed = this.client.util
			.embed()
			.setColor(Constants.Colors.RED)
			.setTitle('Left a Server')
			.addFields({
				name: 'Information',
				value: stripIndents`
					**Member Count**: \`${guild.memberCount?.toLocaleString('en-US')}\`
					**Duration Joined**: ${ms(durationJoined, true)}
					**Owner**: ${owner} \`[${owner?.tag}]\`
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
