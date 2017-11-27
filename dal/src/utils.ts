export function assignFlightDiscriminator(flight: any): void {
	if (flight) {
		if (flight.comingFrom)
			Object.assign(flight, { direction: 'Arriving' });
		else
			Object.assign(flight, { direction: 'Departing' });
	}
}

export function getInnerArray(array: any[]): any[] {
	let innerArray: any[] = array;
	while (innerArray[0] instanceof Array)
		innerArray = innerArray[0] as any[];
	return innerArray;
}