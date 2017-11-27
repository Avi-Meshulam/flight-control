// Strings
export const CONTROL_TOWER: string = 'Tower';

// Objects
export const LEGS = {
	Enter: 1,
	PreLanding: 2,
	Landing: 3,
	Runaway: 4,
	Arrivals: 5,
	Terminal: [6, 7],
	Departures: 8,
	Exit: 9
};

// Arrays
export const ONE_QUEUE_LEGS = [LEGS.PreLanding, LEGS.Landing];
export const ONE_WAY_NO_COMPETITION_LEGS = [LEGS.Enter, LEGS.PreLanding];
