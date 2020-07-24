import Collection from '@discordjs/collection';

export const groupBy = <K, V, G>(
	collection: Collection<K, V>,
	fn: (param: V) => G,
): Collection<G, Collection<K, V>> => {
	const collector: Collection<G, Collection<K, V>> = new Collection();
	for (const [key, val] of collection) {
		const group = fn(val);
		const existing = collector.get(group);
		if (existing) existing.set(key, val);
		else collector.set(group, new Collection([[key, val]]));
	}
	return collector;
};

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
