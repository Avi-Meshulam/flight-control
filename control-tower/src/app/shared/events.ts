import { Observable } from 'rxjs/Observable';

export class ObservableArgs {
	static readonly Empty: ObservableArgs;
}

export class PropertyChangedObservableArgs extends ObservableArgs {
	constructor(
		public readonly propertyName: string,
		public readonly oldValue?: any
	) {
		super();
	}
}

export interface INotifyPropertyChanged {
	propertyChanged: Observable<PropertyChangedObservableArgs>;
}
