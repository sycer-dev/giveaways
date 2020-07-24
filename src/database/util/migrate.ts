import 'reflect-metadata';

import OldGiveaway from '../_oldmodels/Giveaway';
import OldGuild from '../_oldmodels/Guild';
import { createConnection } from 'typeorm';
import { connect } from 'mongoose';
import { Giveaway, Guild } from '..';
import { GiveawayType } from '../../bot/util/constants';

async function migrate() {
	await connect('', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	const connection = await createConnection();

	await connection.query('DELETE FROM guilds;');
	await connection.query('DELETE FROM giveaways;');

	const guilds = await OldGuild.find();
	const vaules = guilds
		.map((g) => ({
			id: g.id,
			prefix: g.prefix,
			manager: g.manager,
			premium: g.premium,
			expiresAt: g.expiresAt,
		}))
		.filter((thing, index, self) => index === self.findIndex((t) => t.id === thing.id));

	console.log('waiting 10 seconds before proceeding...');
	await new Promise((r) => setTimeout(r, 10 * 1000));

	const hrStart = process.hrtime();
	await Guild.createQueryBuilder().insert().values(vaules).execute();
	const hrStop = process.hrtime(hrStart);
	console.dir(`inserted ${guilds.length} guilds, took ${(hrStop[0] * 1e9 + hrStop[1]) / 1e6}ms`);

	const giveaways = await OldGiveaway.find();
	const gvalues = giveaways
		.map((g) => ({
			title: g.title,
			type: g.fcfs ? GiveawayType.FCFS : g.maxEntries ? GiveawayType.LIMITED : GiveawayType.TRADITIONAL,
			emoji: g.emoji,
			guildId: g.guildID,
			channelId: g.channelID,
			messageId: g.messageID,
			winners: g.winnerCount,
			boosted: g.boosted,
			fcfs: g.fcfs,
			drawAt: g.endsAt,
			createdBy: g.createdBy,
			maxEntries: g.maxEntries,
			drawn: g.complete,
		}))
		.filter((item, index, array) => array.indexOf(item) === index);

	console.log('waiting 10 seconds before proceeding...');
	await new Promise((r) => setTimeout(r, 10 * 1000));

	const hrStartTwo = process.hrtime();
	await Giveaway.createQueryBuilder().insert().values(gvalues).execute();
	const hrStopTwo = process.hrtime(hrStartTwo);
	console.dir(`inserted ${guilds.length} guilds, took ${(hrStopTwo[0] * 1e9 + hrStopTwo[1]) / 1e6}ms`);
}

migrate();
