import { WebhookClient } from 'discord.js';
import fetch from 'node-fetch';

export async function postHaste(code: string, lang?: string): Promise<string> {
	try {
		if (code.length > 400 * 1000) {
			return 'Document exceeds maximum length.';
		}
		const res = await fetch('https://paste.nomsy.net/documents', { method: 'POST', body: code });
		const { key, message } = await res.json();
		if (!key) {
			return message;
		}
		return `https://paste.nomsy.net/${key}${lang && `.${lang}`}`;
	} catch (err) {
		throw err;
	}
}

export function shuffle<T>(data: T[]): T[] {
	const array = data.slice();
	for (let i = array.length; i; i--) {
		const randomIndex = Math.floor(Math.random() * i);
		[array[i - 1], array[randomIndex]] = [array[randomIndex], array[i - 1]];
	}
	return array;
}

export function drawOne<T>(shuffled: T[]): T {
	return shuffled[Math.floor(Math.random() * shuffled.length)];
}

export function draw<T>(array: T[], winners: number, filterDuplicates = true): T[] {
	if (array.length <= winners) return array;
	const shuffled = shuffle(array);
	const draw: T[] = [];
	while (draw.length < winners) {
		const w = drawOne(shuffled);
		if (filterDuplicates && !draw.includes(w)) draw.push(w);
	}
	return draw;
}

export function codeb(data: any, lang?: string) {
	const bt = '`';
	return lang ? `${bt.repeat(3)}${lang}\n${data}${bt.repeat(3)}` : `${bt}${data}${bt}`;
}

export function pluralize(number: number, suffix = 's'): string {
	if (number === 1) return '';
	return suffix;
}

export function localize(number: number, locale = 'en-US'): string {
	try {
		return new Intl.NumberFormat(locale).format(number);
	} catch {}
	return new Intl.NumberFormat('en-US').format(number);
}

export function resolveWebhookURL(data: string): [string, string] | null {
	const webhookRegex = /discordapp\.com\/api\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/i;
	const match = webhookRegex.exec(data);
	if (match && match[1] && match[2]) return [match[1], match[2]];
	return null;
}

export function makeWebhook(id: string, token: string): WebhookClient {
	return new WebhookClient(id, token, { disableMentions: 'everyone' });
}

export function random(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

export const chunkArray = <T>(list: T[], chunksize: number): T[][] =>
	new Array(Math.ceil(list.length / chunksize)).fill(undefined).map(() => list.splice(0, chunksize));

export function smartChunk(data: string[], maxPerChunk: number): string[][] {
	let buffer: string[] = [];
	const fragments: string[][] = [];
	for (const content of data) {
		if (content.length + buffer.length < maxPerChunk) buffer.push(content);
		else {
			fragments.push(buffer);
			buffer = [];
		}
	}
	if (buffer.length) fragments.push(buffer);
	return fragments;
}

export function smartMentionSplit(mentions: string[], maxLength = 1900): string[] {
	let _buffer = '';
	const fragments: string[] = [];
	for (const mention of mentions) {
		if (mention.length + _buffer.length > maxLength) {
			fragments.push(_buffer);
			_buffer = '';
		} else {
			_buffer += mention;
		}
	}
	fragments.push(_buffer);
	return fragments;
}

export function makeMessageLink(guild: string, channel: string, msg: string): string {
	return `https://discordapp.com/channels/${guild}/${channel}/${msg}`;
}

export function pad(value: any, length = 4, padWith = '0') {
	return `${value}`.padStart(length, padWith);
}
