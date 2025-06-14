export const LAUNDRY_SLOTS = [
	{ start: 7, end: 11, label: '07-11' },
	{ start: 11, end: 15, label: '11-15' },
	{ start: 15, end: 19, label: '15-19' },
	{ start: 19, end: 22, label: '19-22' }
] as const;

export const BBQ_SLOT = { start: 8, end: 20, label: '08-20' } as const;

export type LaundrySlot = (typeof LAUNDRY_SLOTS)[number];
export type BBQSlot = typeof BBQ_SLOT;
export type TimeSlot = LaundrySlot | BBQSlot;
