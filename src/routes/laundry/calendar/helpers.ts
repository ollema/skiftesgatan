import {
	CalendarDate,
	CalendarDateTime,
	ZonedDateTime,
	getLocalTimeZone
} from '@internationalized/date';

export type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;

export function getTodaysDate() {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();

	return new CalendarDate(year, month, day);
}

export function toDate(date: DateValue, tz = getLocalTimeZone()) {
	if (date instanceof ZonedDateTime) {
		return date.toDate();
	} else {
		return date.toDate(tz);
	}
}

export function getWeekFromDate(date: DateValue) {
	const d = toDate(date);
	const msPerDay = 86400000;

	// set date to nearest Thursday: current date + 4 - current day number
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

	// get first day of year
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

	// calculate full weeks to nearest Thursday
	const week = Math.ceil(((d.getTime() - yearStart.getTime()) / msPerDay + 1) / 7);

	return week;
}
