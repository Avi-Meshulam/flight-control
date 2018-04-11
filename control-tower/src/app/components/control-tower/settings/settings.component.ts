import { AfterViewInit, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import 'bootstrap-slider';
import * as $ from 'jquery';
import { DataService, DBCollection } from '../services/data.service';
import { OutgoingMessageType, SocketService } from '../services/socket.service';

export enum SafetyMode {
	Pessimistic,
	Optimistic,
	Risky
}

enum YesNoOption {
	Yes = 'Yes',
	No = 'No'
}

type Range = {
	min: number;
	max: number;
};

type SimulatorSettings = {
	intervalRange: Range;
};

type Settings = {
	speedPercentageRange: Range;
	safetyMode: SafetyMode;
	radioResponseTime: number;
	simulatorSettings: SimulatorSettings;
};

const DEFAULT_MIN_SPEED_PERCENT = 75;
const DEFAULT_MAX_SPEED_PERCENT = 90;
const MIN_RADIO_RESPONSE_TIME = 0;
const MAX_RADIO_RESPONSE_TIME = 5000;
const DEFAULT_RADIO_RESPONSE_TIME = 2000;
const SIMULATOR_DEFAULT_MIN_INTERVAL = 10;
const SIMULATOR_DEFAULT_MAX_INTERVAL = 1000;
const SIMULATOR_INTERVAL_MIN_LIMIT = 10;
const SIMULATOR_INTERVAL_MAX_LIMIT = 10000;
const SAVE_DELAY_TIME = 3000;

@Component({
	selector: 'fc-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements AfterViewInit {

	private static _dataService: DataService;
	private static _socketService: SocketService;
	private static _isSaveInProcess = false;
	private static _isSimulatorSettingsInProcess = false;

	constructor(
		dataService: DataService,
		socketService: SocketService
	) {
		SettingsComponent._dataService = dataService;
		SettingsComponent._socketService = socketService;
	}

	readonly radioResponseTimeRange: Range = {
		min: MIN_RADIO_RESPONSE_TIME,
		max: MAX_RADIO_RESPONSE_TIME
	};

	readonly simulatorIntervalLimit: Range = {
		min: SIMULATOR_INTERVAL_MIN_LIMIT,
		max: SIMULATOR_INTERVAL_MAX_LIMIT
	};

	//#region Properties
	private _isSocketConnected = false;
	get isSocketConnected(): boolean {
		return this._isSocketConnected;
	}
	set isSocketConnected(value: boolean) {
		if (this._isSocketConnected !== value) {
			this._isSocketConnected = value;
			if (this._isSocketConnected)
				SettingsComponent._socketService.connect();
			else
				SettingsComponent._socketService.disconnect();
		}
	}

	private static readonly _speedPercentageRange: Range = {
		min: DEFAULT_MIN_SPEED_PERCENT, max: DEFAULT_MAX_SPEED_PERCENT
	};
	static get speedPercentageRange(): Range {
		return SettingsComponent._speedPercentageRange;
	}
	static set speedPercentageRange(value: Range) {
		if (SettingsComponent._speedPercentageRange !== value) {
			SettingsComponent._speedPercentageRange.min = value.min;
			SettingsComponent._speedPercentageRange.max = value.max;
			SettingsComponent.save();
		}
	}

	private static readonly _storyDurationRange: Range = {
		min: SettingsComponent.speedPercentageToDuration(SettingsComponent._speedPercentageRange.min),
		max: SettingsComponent.speedPercentageToDuration(SettingsComponent._speedPercentageRange.max)
	};

	private static _safetyMode = SafetyMode.Risky;
	static get safetyMode(): SafetyMode {
		return SettingsComponent._safetyMode;
	}
	static set safetyMode(value: SafetyMode) {
		if (SettingsComponent._safetyMode !== value) {
			SettingsComponent._safetyMode = value;
			SettingsComponent.save();
		}
	}

	private static _radioResponseTime = DEFAULT_RADIO_RESPONSE_TIME;
	static get radioResponseTime(): number {
		return SettingsComponent._radioResponseTime;
	}
	static set radioResponseTime(value: number) {
		if (SettingsComponent._radioResponseTime !== value) {
			SettingsComponent._radioResponseTime = value;
			SettingsComponent.save();
		}
	}

	private static readonly _simulatorIntervalRange: Range = {
		min: SIMULATOR_DEFAULT_MIN_INTERVAL, max: SIMULATOR_DEFAULT_MAX_INTERVAL
	};
	static get simulatorIntervalRange(): Range {
		return SettingsComponent._simulatorIntervalRange;
	}
	static set simulatorIntervalRange(value: Range) {
		if (SettingsComponent._simulatorIntervalRange !== value) {
			SettingsComponent._simulatorIntervalRange.min = value.min;
			SettingsComponent._simulatorIntervalRange.max = value.max;
			SettingsComponent.save();
			SettingsComponent.applySimulatorSettings();
		}
	}
	//#endregion Properties

	ngAfterViewInit(): void {
		SettingsComponent._dataService.getAll(DBCollection.Settings)
			.then(data => {
				SettingsComponent.restore(data[0]);
				this.initSliders();
			})
			.catch(err => console.error(err));
	}

	static getStoryDurationRange(storyTitle: string): Range {
		return {
			min: SettingsComponent.getStoryDuration(storyTitle, SettingsComponent._storyDurationRange.min),
			max: SettingsComponent.getStoryDuration(storyTitle, SettingsComponent._storyDurationRange.max)
		};
	}

	private static getSettings(): Settings {
		return {
			speedPercentageRange: SettingsComponent._speedPercentageRange,
			safetyMode: SettingsComponent._safetyMode,
			radioResponseTime: SettingsComponent._radioResponseTime,
			simulatorSettings: {
				intervalRange: SettingsComponent._simulatorIntervalRange
			}
		};
	}

	private static getSimulatorSettings(): SimulatorSettings {
		return {
			intervalRange: SettingsComponent._simulatorIntervalRange
		};
	}

	private static save(): void {
		if (!SettingsComponent._isSaveInProcess) {
			setTimeout(() => {
				SettingsComponent._dataService.update(DBCollection.Settings, {}, SettingsComponent.getSettings());
				console.log(`Settings changed to: ${JSON.stringify(SettingsComponent.getSettings())}\n`);
				// console.log(`Settings changed to:\n${SettingsComponent.stringify()}\n`);
				SettingsComponent._isSaveInProcess = false;
			}, SAVE_DELAY_TIME);
			SettingsComponent._isSaveInProcess = true;
		}
	}

	private static restore(obj: any): void {
		if (!obj) return;
		SettingsComponent._speedPercentageRange.min = obj.speedPercentageRange.min;
		SettingsComponent._speedPercentageRange.max = obj.speedPercentageRange.max;
		SettingsComponent._safetyMode = obj.safetyMode;
		SettingsComponent._radioResponseTime = obj.radioResponseTime;
		SettingsComponent.restoreSimulatorSettings(obj.simulatorSettings);
		SettingsComponent.setStoryDurationRange();
	}

	private static restoreSimulatorSettings(obj: SimulatorSettings): void {
		SettingsComponent._simulatorIntervalRange.min = obj.intervalRange.min;
		SettingsComponent._simulatorIntervalRange.max = obj.intervalRange.max;
		SettingsComponent.applySimulatorSettings();
	}

	private static applySimulatorSettings(): void {
		if (!SettingsComponent._isSimulatorSettingsInProcess) {
			setTimeout(() => {
				SettingsComponent._socketService.send(OutgoingMessageType.Settings, SettingsComponent.getSimulatorSettings());
				SettingsComponent._isSimulatorSettingsInProcess = false;
			}, SAVE_DELAY_TIME);
			SettingsComponent._isSimulatorSettingsInProcess = true;
		}
	}

	private static setStoryDurationRange(): void {
		SettingsComponent._storyDurationRange.min =
			SettingsComponent.speedPercentageToDuration(SettingsComponent._speedPercentageRange.min);
		SettingsComponent._storyDurationRange.max =
			SettingsComponent.speedPercentageToDuration(SettingsComponent._speedPercentageRange.max);
	}

	private static durationToSpeedPercentage(duration: number): number {
		return 100 - (duration / 100);
	}

	private static speedPercentageToDuration(speedPercentage: number): number {
		return (100 - speedPercentage) * 100;
	}

	private static getStoryDuration(storyTitle: string, baseDuration: number): number {
		if (!baseDuration)
			baseDuration = 10;

		switch (storyTitle) {
			// case 'leg1start':
			// 	return baseDuration;
			// case 'leg1to2':
			// 	return baseDuration;
			// case 'leg2to3':
			// 	return baseDuration;
			case 'leg3to4':
				return baseDuration * 2.5;
			case 'leg4to5':
				return baseDuration * 1.5;
			case 'leg5to6':
				return baseDuration * 2;
			// case 'leg6end':
			// 	return baseDuration;
			case 'leg5to7': return baseDuration * 3;
			// case 'leg7end':
			// 	return baseDuration;
			// case 'leg6start':
			// 	return baseDuration;
			case 'leg6to8':
				return baseDuration * 3;
			// case 'leg7start':
			// 	return baseDuration;
			case 'leg7to8':
				return baseDuration * 2;
			// case 'leg8to4':
			// 	return baseDuration;
			case 'leg4to9':
				return baseDuration * 1.5;
			// case 'leg9end':
			// 	return baseDuration;
			default:
				return baseDuration;
		}
	}

	private initSliders(): void {
		let self = SettingsComponent;

		$('#speedPercentageRange')
			.slider({
				id: 'speedPercentageRangeSlider',
				min: 1,
				max: 100,
				step: 1,
				value: [
					SettingsComponent._speedPercentageRange.min,
					SettingsComponent._speedPercentageRange.max
				]
			})
			.on('change', $event => {
				self.speedPercentageRange = { min: $event['value']['newValue'][0], max: $event['value']['newValue'][1] };
				self.setStoryDurationRange();
			});

		$('#safetyMode')
			.slider({
				id: 'safetyModeSlider',
				ticks: [SafetyMode.Pessimistic, SafetyMode.Optimistic, SafetyMode.Risky],
				ticks_labels: [SafetyMode[SafetyMode.Pessimistic], SafetyMode[SafetyMode.Optimistic], SafetyMode[SafetyMode.Risky]],
				min: SafetyMode.Pessimistic,
				max: SafetyMode.Risky,
				step: 1,
				value: SafetyMode.Risky,
				formatter: value => {
					switch (value) {
						case SafetyMode.Pessimistic:
							return `${SafetyMode[SafetyMode.Pessimistic]}: Move only when preceding plane reaches next leg`;
						case SafetyMode.Optimistic:
							return `${SafetyMode[SafetyMode.Optimistic]}: Move as soon as preceding plane confirms move, excluding runaway track`;
						case SafetyMode.Risky:
							return `${SafetyMode[SafetyMode.Risky]}: Move as soon as preceding plane confirms move, including runaway track`;
						default:
							break;
					}
				}
			})
			.on('change', $event => {
				self.safetyMode = $event['value']['newValue'];
			});

		$('#responseTime')
			.slider({
				id: 'responseTimeSlider',
				min: this.radioResponseTimeRange.min,
				max: this.radioResponseTimeRange.max,
				step: 100,
				value: SettingsComponent.radioResponseTime
			})
			.on('change', $event => {
				self.radioResponseTime = $event['value']['newValue'] || 5;
			});


		$('#simulatorIntervalRange')
			.slider({
				id: 'simulatorIntervalRangeSlider',
				min: this.simulatorIntervalLimit.min,
				max: this.simulatorIntervalLimit.max,
				step: 10,
				value: [
					SettingsComponent._simulatorIntervalRange.min,
					SettingsComponent._simulatorIntervalRange.max
				]
			})
			.on('change', $event => {
				self.simulatorIntervalRange = { min: $event['value']['newValue'][0], max: $event['value']['newValue'][1] };
			});
	}
}
