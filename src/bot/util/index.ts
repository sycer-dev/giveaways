export function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length; i; i--) {
		const j = Math.floor(Math.random() * i);
		[arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
	}
	return arr;
}

export function drawOne<T>(list: T[]): T {
	const shuffled = shuffle(list);
	return shuffled[Math.floor(Math.random() * shuffled.length)];
}

export function draw<T>(array: T[], winners: number): T[] {
	if (array.length <= winners) return array;
	const draw: T[] = [];
	while (draw.length < winners) {
		const w = drawOne(array);
		if (!draw.includes(w)) draw.push(w);
	}
	return draw;
}
