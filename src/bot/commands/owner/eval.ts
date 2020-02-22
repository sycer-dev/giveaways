import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { inspect } from 'util';
import { stripIndents } from 'common-tags';
import { execSync } from 'child_process';

export default class EvalCommand extends Command {
	public constructor() {
		super('eval', {
			category: 'owner',
			aliases: ['eval', 'js', 'e'],
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
			description: {
				content: 'Evaluate JavaScript code.',
			},
			ownerOnly: true,
		});
	}

	public async exec(
		msg: Message,
		{ code, terminal }: { code: string; terminal: boolean },
	): Promise<Message | Message[] | void> {
		if (terminal) {
			try {
				const exec = execSync(code).toString();
				return msg.util?.send(exec.substring(0, 1900), { code: 'fix' });
			} catch (err) {
				return msg.util?.send(err.toString(), { code: 'fix' });
			}
		}

		let evaled;
		const start = Date.now();
		let type;
		try {
			// eslint-disable-next-line
			evaled = eval(code); 
			type = typeof evaled;
			// eslint-disable-next-line
			if (evaled != null && typeof evaled.then === 'function') evaled = await evaled;
			if (typeof evaled === 'object') {
				evaled = inspect(evaled, {
					depth: 0,
				});
			}
		} catch (err) {
			return msg.util?.send(stripIndents`
                An error occured!
                \`\`\`xl\n${err}
                \`\`\`
           `);
		}
		const end = Date.now();
		if (!evaled) {
			await msg.react('🤷‍').catch(() => msg);
			return msg;
		}
		if (evaled.length > 1500) {
			evaled = 'Response too long.';
		}
		return msg.util?.send(stripIndents`
            **Output**:
            \`\`\`js\n${evaled}
            \`\`\`
            **Type**:
            \`\`\`js\n${type}
            \`\`\`
            ⏱ ${end - start}ms
        `);
	}
}
