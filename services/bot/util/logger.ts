import { createLogger, transports, format, addColors } from 'winston';

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
	},
};

addColors(loggerLevels.colors);

// const levels = Object.keys(loggerLevels.levels);
// const level = levels[levels.length - 1];

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
				rest instanceof Error ? rest : Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
			}`;
		}),
	),
	transports: new transports.Console(),
	level: 'custom',
});
