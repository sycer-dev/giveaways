import { execSync } from 'child_process';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import util from 'util';
import { Linter } from 'eslint';
import { postHaste } from '../../util';
import { MESSAGES, SENSITIVE_PATTERN_REPLACEMENT } from '../../util/constants';
// eslint-disable-next-line
const config = require('eslint-config-marine/prettier/node');

export default class EvalCommand extends Command {
	private readonly linter = new Linter();

	public constructor() {
		super('eval', {
			category: 'owner',
			aliases: ['eval', 'js', 'e'],
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: 'Evaluate JavaScript code.',
			},
			ownerOnly: true,
			args: [
				{
					id: 'code',
					match: 'text',
					prompt: {
						start: 'what code would you like to evaluate?',
					},
				},
				{
					id: 'terminal',
					flag: ['--t'],
					match: 'flag',
				},
			],
		});
	}

	private _clean(text: any): any {
		if (typeof text === 'string') {
			text = text.replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);

			return text.replace(new RegExp(this.client.token!, 'gi'), SENSITIVE_PATTERN_REPLACEMENT);
		}

		return text;
	}

	private _format(code: string): string {
		const formatted = this.linter.verifyAndFix(code, config);
		return formatted.output;
	}

	public async exec(
		msg: Message,
		{
			code,
			terminal,
		}: {
			code: string;
			terminal: boolean;
		},
	): Promise<Message | Message[] | void> {
		if (terminal) {
			try {
				const exec = execSync(code).toString();
				return msg.util!.send(exec.substring(0, 1900), { code: 'fix' });
			} catch (err) {
				return msg.util!.send(err.toString(), { code: 'fix' });
			}
		}

		let evaled;
		try {
			const hrStart = process.hrtime();
			evaled = eval(code); // eslint-disable-line no-eval

			// eslint-disable-next-line
			if (evaled != null && typeof evaled.then === 'function') evaled = await evaled;
			const hrStop = process.hrtime(hrStart);

			let response = '';
			response += MESSAGES.COMMANDS.EVAL.INPUT(this._format(code));
			response += MESSAGES.COMMANDS.EVAL.OUTPUT(this._clean(util.inspect(evaled, { depth: 0 })));
			response += `• Type: \`${typeof evaled}\``;
			response += ` • time taken: \`${(hrStop[0] * 1e9 + hrStop[1]) / 1e6}ms\``;

			if (response.length > 20000) {
				try {
					const hasteLink = await postHaste(this._clean(util.inspect(evaled)));
					return msg.util?.send(MESSAGES.COMMANDS.EVAL.LONG_OUTPUT(hasteLink));
				} catch (hasteerror) {
					return msg.util?.send(MESSAGES.COMMANDS.EVAL.ERRORS.TOO_LONG);
				}
			}

			if (response.length > 0) {
				await msg.util?.send(response);
			}
		} catch (err) {
			this.client.logger.error('[EVAL ERROR]', err.stack);
			return msg.util?.send(MESSAGES.COMMANDS.EVAL.ERRORS.CODE_BLOCK(this._clean(err)));
		}
	}
}
