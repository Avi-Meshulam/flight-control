import * as anime from 'animejs';
import { IAttribute } from './DOMUtils';

export interface IAnimationFrame {
	path?: HTMLElement;
	durationPercent?: number;
	element?: HTMLElement;
	attributes?: IAttribute[];
}

export interface IAnimationStory {
	title: string;
	startElement: HTMLElement;
	frames: IAnimationFrame[];
	duration: number;
}

enum Effect {
	Switch,
	CrossFade
}

export class Animation {

	// Moves an element (existing or new) according to parameters in frames array.
	animate(story: IAnimationStory, autoplay: boolean = true): anime.AnimeTimelineInstance {

		let timeline = anime.timeline({autoplay: autoplay});

		let prevElement = story.startElement;
		let defaultFrameDuration = this.calcDefaultFrameDuration(story.frames, story.duration);

		story.frames.forEach(frame => {
			frame.element = frame.element || prevElement;

			let animObj = {
				targets: frame.element,
				easing: 'linear',
				duration: frame.durationPercent ? story.duration * frame.durationPercent / 100 : defaultFrameDuration
			};

			if (frame.element !== prevElement) {
				if (prevElement === story.startElement)
					this.addEffect(animObj, frame.element, prevElement, Effect.Switch);
				else
					this.addEffect(animObj, frame.element, prevElement, Effect.CrossFade);

				prevElement = frame.element;
			}

			if (frame.path) {
				animObj['translateX'] = anime.path(frame.path)('x');
				animObj['translateY'] = anime.path(frame.path)('y');
			}

			if (frame.attributes)
				frame.attributes.forEach(attr => animObj[attr.name] = attr.value);

				timeline.add(animObj);
		}, this);

		return timeline;
	}

	private addEffect(animObj: object, element: HTMLElement, prevElement: HTMLElement, effect: Effect): void {
		switch (effect) {
			case Effect.Switch:
				animObj['begin'] = (anim) => {
					element.style.display = '';
					prevElement.style.display = 'none';
				};
				break;
			case Effect.CrossFade:
				animObj['begin'] = (anim) => {
					element.style.opacity = '0';
					element.style.display = '';
				};

				// cross-fade between previous and new element
				animObj['update'] = (anim) => {
					element.style.opacity = (anim.progress / 100).toString();
					prevElement.style.opacity = (1 - (anim.progress / 100)).toString();
				};

				animObj['complete'] = (anim) => {
					prevElement.style.display = 'none';
					prevElement.style.opacity = '1';
				};
				break;
			default:
				break;
		}
	}

	private calcDefaultFrameDuration(frames: IAnimationFrame[], storyDuration: number): number {
		let framesWithDurationCount: number = 0;
		let totalDurationPercent: number = 0;

		frames.forEach(frame => {
			if (frame.durationPercent) {
				framesWithDurationCount += 1;
				totalDurationPercent += frame.durationPercent;
			}
		});

		if (totalDurationPercent > 0 && totalDurationPercent <= 100)
			return storyDuration * (100 - totalDurationPercent) / 100 / (frames.length - framesWithDurationCount);
		else
			return storyDuration / frames.length;
	}
}
