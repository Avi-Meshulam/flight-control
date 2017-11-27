export default class Utils {
	static getRandomInt(min: number, max: number): number {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	static delay(ms: number): Promise<void> {
		return new Promise<void>(resolve => {
			setTimeout(resolve, ms);
		});
	}
}
