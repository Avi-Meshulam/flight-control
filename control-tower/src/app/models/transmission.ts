export enum ReplyCode {
	Affirmative = 'Affirmative',
	Negative = 'Negative',
	ComeIn = 'Come In',
	Roger = 'Roger',
	Over = 'Over',
	SayAgain = 'Say Again',
	Standby = 'Standby',
	Out = 'Out'
}

export interface ITransmission {
	from: string;
	to: string;
	message?: string;
	replyCode: ReplyCode;
	data?: object;
}

export interface IFormattedTransmission {
	header?: string;
	body: string;
}

export class Transmission implements ITransmission {
	constructor(
		public readonly from: string,
		public readonly to: string,
		public readonly message?: string,
		public readonly replyCode: ReplyCode = ReplyCode.Over,
		public readonly data?: object
	) {
	}

	static createConfirmation(from: string, to: string): Transmission {
		return new Transmission(from, to, '', ReplyCode.Roger);
	}

	static isTransmission(transmission: any): transmission is Transmission {
		return transmission && transmission.from && transmission.to && transmission.replyCode;
	}

	static format(data: any): IFormattedTransmission {
		if (Transmission.isTransmission(data))
			return {
				header: `${data.to} from ${data.from}:`,
				body: `${data.message}${data.replyCode !== ReplyCode.Out ? data.message ? `, ${data.replyCode}.` : `${data.replyCode}.` : ''}`
			};
		else
			return {
				body: JSON.stringify(data)
			};
	}

	static stringify(data: any): string {
		let transmission = Transmission.format(data);
		return `${transmission.header ? `${transmission.header} ` : ''}${transmission.body}\n`;
	}
}
