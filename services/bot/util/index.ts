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
