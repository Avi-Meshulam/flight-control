import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/scan';

const DEFAULT_RETRY_ATTEMPTS: number = 5;
const DEFAULT_RETRY_DELAY_TIME: number = 1000;

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

	static retryStrategy(
		attempts: number = DEFAULT_RETRY_ATTEMPTS,
		delay: number = DEFAULT_RETRY_DELAY_TIME)
		: (errors: Observable<any>) => Observable<any> {

		return (errors) => {
			return errors
				.scan((acc, value) => {
					acc += 1;
					if (acc < attempts) {
						return acc;
					}
					else {
						throw new Error(value);
					}
				}, 0)
				.delay(delay);
		};
	}

	static getFileName(path: string): string {
		return path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
	}
}
