import { Time } from '@internationalized/date';

export type Timeslot = {
	start: Time;
	end: Time;
};

export type Timeslots = Timeslot[];

export const timeslots = [
	{
		start: new Time(7, 0),
		end: new Time(11, 0)
	},
	{
		start: new Time(11, 0),
		end: new Time(15, 0)
	},
	{
		start: new Time(15, 0),
		end: new Time(19, 0)
	},
	{
		start: new Time(19, 0),
		end: new Time(22, 0)
	}
];
