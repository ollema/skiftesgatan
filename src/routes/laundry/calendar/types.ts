export type SerializableReservation = { apartment: string; start: string; end: string };

export type SerializableReservationMap = { [start: string]: SerializableReservation };

export type NestedReservationMap = {
	[date: string]: { [startTime: string]: SerializableReservation };
};
