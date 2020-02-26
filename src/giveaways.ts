import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import GiveawayClient from './bot/client/GiveawayClient';

(async () => {
	const parent = new GiveawayClient({
		token: process.env.TOKEN!,
		color: Number(process.env.COLOR!),
		owners: process.env.OWNERS!.split(','),
	});
	return parent.launch();
})();
