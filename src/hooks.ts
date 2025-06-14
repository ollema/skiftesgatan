import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import type { Transport } from '@sveltejs/kit';

export const transport: Transport = {
	CalendarDate: {
		encode: (value) => value instanceof CalendarDate && [value.year, value.month, value.day],
		decode: ([year, month, day]) => new CalendarDate(year, month, day)
	},
	CalendarDateTime: {
		encode: (value) =>
			value instanceof CalendarDateTime && [
				value.year,
				value.month,
				value.day,
				value.hour,
				value.minute,
				value.second
			],
		decode: ([year, month, day, hour, minute, second]) =>
			new CalendarDateTime(year, month, day, hour, minute, second)
	}
};
