import { Options } from 'pretty-ms';

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

export const PRETTY_MS_SETTINGS = {
	millisecondsDecimalDigits: 0,
	secondsDecimalDigits: 0,
	separateMilliseconds: true,
	verbose: true,
} as Options;

export interface TierOptions {
	title: string;
	emoji: string;
	ask?: string;
	failed?: string;
	required?: boolean;
	normal?: boolean;
	reaction?: boolean;
	value?: string | number;
	default?: string | number;
}

export const TIER_ONE_EMOJIS = ['📋', '💰', '📦', '🎉', '⏰', '📊', '🛑'];
export const TIER_TWO_EMOJIS = ['📋', '💰', '📦', '🎉', '⏰', '🛑'];
export const TIER_TRE_EMOJIS = ['📋', '💰', '📦', '🎉', '⏰', '👥', '🛑'];

const STOP_DATA = {
	emoji: '🛑',
	title: 'Exit Builder',
};

export const SEND_DATA = {
	emoji: '✅',
	title: 'Start Giveaway',
};

export const TIER_ONE_DATA: TierOptions[] = [
	{
		emoji: '📋',
		title: 'Title',
		ask: 'What would you like to title this giveaway?',
		required: true,
		value: '',
		normal: true,
	},
	{
		emoji: '💰',
		title: 'Winner Count',
		ask: 'How many winners would you like there to be?',
		failed: 'Invalid number provided - please re-react and try again.',
		required: true,
		value: 0,
		normal: true,
	},
	{
		emoji: '📦',
		title: 'Channel',
		ask: 'What channel would you like to host this giveaway in?',
		failed: 'Invalid text channel - please re-react and try again.',
		required: true,
		value: '',
	},
	{
		emoji: '🎉',
		title: 'Emoji',
		ask: "Please react to this message with the emoji you'd like to use.",
		failed: "That emoji's in a server I don't have access to! Please try again with a different emoji.",
		reaction: true,
		default: '🎉',
		value: '🎉',
	},
	{
		emoji: '⏰',
		title: 'Duration',
		ask: 'How long would you like the giveaway to last? Please provide a valid duration such as `20m` or `3 days`.',
		failed: 'Invalid duration string - please re-react and try again.',
		required: true,
		value: 0,
	},
	{
		emoji: '📊',
		title: 'Role-based Extra Entries',
	},
	STOP_DATA,
];

export const TIER_TWO_DATA: TierOptions[] = [
	{
		emoji: '📋',
		title: 'Title',
		ask: 'What would you like to title this giveaway?',
		required: true,
		value: '',
	},
	{
		emoji: '💰',
		title: 'Winner Count',
		ask: 'How many winners would you like there to be?',
		failed: 'Invalid number provided - please re-react and try again.',
		required: true,
		value: 0,
	},
	{
		emoji: '📦',
		title: 'Channel',
		ask: 'What channel would you like to host this giveaway in?',
		failed: 'Invalid text channel - please re-react and try again.',
		required: true,
		value: '',
	},
	{
		emoji: '🎉',
		title: 'Emoji',
		ask: "Please react to this message with the emoji you'd like to use.",
		failed: "That emoji's in a server I don't have access to! Please try again with a different emoji.",
		reaction: true,
		default: '🎉',
		value: '🎉',
	},
	{
		emoji: '⏰',
		title: 'Timeout (if winner count is not met)',
		ask:
			'After how long would you like the giveaway to timeout? Please provide a valid duration such as `20m` or `3 days`.',
		failed: 'Invalid duration string - please re-react and try again.',
		required: true,
		value: 0,
	},
	STOP_DATA,
];

export const TIER_THREE_DATA: TierOptions[] = [
	{
		emoji: '📋',
		title: 'Title',
		ask: 'What would you like to title this giveaway?',
		required: true,
		value: '',
	},
	{
		emoji: '👥',
		title: 'Max Entries',
		ask: "What is the maximum amount of entries you'd like to permit?",
		failed: 'Invalid number provided - please re-react and try again.',
		required: true,
		value: 0,
	},
	{
		emoji: '💰',
		title: 'Winner Count',
		ask: 'How many winners would you like there to be?',
		failed: 'Invalid number provided - please re-react and try again.',
		required: true,
		value: 0,
	},
	{
		emoji: '📦',
		title: 'Channel',
		ask: 'What channel would you like to host this giveaway in?',
		failed: 'Invalid text channel - please re-react and try again.',
		required: true,
		value: '',
	},
	{
		emoji: '🎉',
		title: 'Emoji',
		ask: "Please react to this message with the emoji you'd like to use.",
		failed: "That emoji's in a server I don't have access to! Please try again with a different emoji.",
		default: '🎉',
		value: '🎉',
		reaction: true,
	},
	{
		emoji: '⏰',
		title: 'Timeout (if winner count is not met)',
		ask:
			'After how long would you like the giveaway to timeout? Please provide a valid duration such as `20m` or `3 days`.',
		failed: 'Invalid duration string - please re-react and try again.',
		required: true,
		value: 0,
	},
	STOP_DATA,
];
