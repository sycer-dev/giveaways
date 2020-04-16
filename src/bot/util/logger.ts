import { createLogger, transports, format, addColors } from 'winston';

declare module 'winston' {
	interface Logger {
		mongo: LeveledLogMethod;
		shard: LeveledLogMethod;
	}
}

const loggerLevels = {
	levels: {
		error: 0,
		debug: 1,
		warn: 2,
		data: 3,
		info: 4,
		verbose: 5,
		silly: 6,
		custom: 7,
		mongo: 8,
		shard: 9,
	},
	colors: {
		error: 'red',
		debug: 'blue',
		warn: 'yellow',
		data: 'grey',
		info: 'green',
		verbose: 'cyan',
		silly: 'magenta',
		custom: 'yellow',
		mongo: 'green whiteBG italic',
		shard: 'blue whiteBG',
	},
};

addColors(loggerLevels.colors);

export const logger = createLogger({
	levels: loggerLevels.levels,
	format: format.combine(
		format.colorize({ level: true }),
		format.errors({ stack: true }),
		format.splat(),
		format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
		format.printf((data: any) => {
			const { timestamp, level, message, ...rest } = data;
			return `[${timestamp}] ${level}: ${message}${
				Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
			}`;
		}),
	),
	transports: new transports.Console(),
	level: 'shard',
});
