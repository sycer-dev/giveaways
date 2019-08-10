import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import SettingsProvider from './classes/SettingsProvider';
import GiveawayClient from './classes/GiveawayClient';

(async () => {
	console.info('in function');
	const parent = new GiveawayClient({
		token: process.env.TOKEN!,
		color: Number(process.env.COLOR!),
		owners: process.env.OWNERS!.split(','),
	});

	parent.logger.info('[STARTUP] Initializing SettingsProvider.');
	const db = new SettingsProvider(parent);
	parent.logger.info('[STARTUP] Starting SettingsProvider.');
	await db.init();
	parent.settings = db;

	parent.logger.info('[STARTUP] Launching GiveawayClient.');
	await parent.launch();

	return parent.logger.info('[STARTUP] Launched GiveawayClient.');
})();
