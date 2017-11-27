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

interface ITransmission {
	from: string;
	to: string;
	message?: string;
	replyCode: ReplyCode;
	data?: object;
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

	static isTransmission(data: any): data is Transmission {
		return data && data.from && data.to && data.replyCode;
	}

	static stringify(data: any): string {
		if (Transmission.isTransmission(data))
		return `${data.to} from ${data.from}: ${data.message ? `${data.message}` : ''}${data.replyCode !== ReplyCode.Out ? data.message ? `, ${data.replyCode}.` : `${data.replyCode}.` : ''}\n`;
		else
			return JSON.stringify(data);
	}
}
