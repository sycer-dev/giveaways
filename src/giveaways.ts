import GiveawayClient from './bot/client/GiveawayClient';

new GiveawayClient({
	token: process.env.TOKEN!,
	color: Number(process.env.COLOR!),
	owners: process.env.OWNERS!.split(','),
}).launch();
