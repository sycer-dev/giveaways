import { Options } from 'pretty-ms';

export interface Flag {
	flags: string[];
	description: string;
}

export const SENSITIVE_PATTERN_REPLACEMENT = '[REDACTED]';

export const MESSAGES = {
	NOT_ACTIVATED: "this server hasn't been activated yet!",
	COMMANDS: {
		EVAL: {
			LONG_OUTPUT: (link: string): string => `Output too long, uploading it to hastebin instead: ${link}.`,
			INPUT: (code: string): string => `Input:\`\`\`js\n${code}\n\`\`\``,
			OUTPUT: (code: string): string => `Output:\`\`\`js\n${code}\n\`\`\``,
			TYPE: ``,
			TIME: ``,
			HASTEBIN: ``,
			ERRORS: {
				TOO_LONG: `Output too long, failed to upload to hastebin as well.`,
				CODE_BLOCK: (err: Error): string => `Error:\`\`\`xl\n${err}\n\`\`\``,
			},
		},
	},
};

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
