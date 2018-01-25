import { Observable } from 'rxjs/Observable';

export class EventArgs {
	static readonly Empty: EventArgs;
}

export class PropertyChangedEventArgs extends EventArgs {
	constructor(
		public readonly propertyName: string,
		public readonly oldValue?: any
	) {
		super();
	}
}

export interface INotifyPropertyChanged {
	propertyChanged: Observable<PropertyChangedEventArgs>;
}
