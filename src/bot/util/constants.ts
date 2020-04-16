import { Options } from 'pretty-ms';

export interface Flag {
	flags: string[];
	description: string;
}

export const EMOJIS = {
	'0': '686090767571222643',
	'1': '686090767860891687',
	'2': '686090767491399697',
	'3': '686090767869280279',
	'4': '686090767919480918',
	'5': '686090767973875801',
	'6': '686090767915286558',
	'7': '686090767718285333',
	'8': '686090767927738369',
	'9': '686090767617359890',
	countdown: '686090767881470006',
} as { [key: string]: string };

export const PRETTY_MS_SETTINGS: Options = {
	millisecondsDecimalDigits: 0,
	secondsDecimalDigits: 0,
	separateMilliseconds: true,
	verbose: true,
};
