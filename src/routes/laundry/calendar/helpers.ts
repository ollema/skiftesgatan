import type { ReservationsResponse } from '$lib/pocketbase-types';
import {
	parseDateTime,
	CalendarDate,
	ZonedDateTime,
	getLocalTimeZone,
	DateFormatter,
	toTime,
	now,
	type DateValue
} from '@internationalized/date';

export function parsePocketBaseDateTime(pbdt: string) {
	return parseDateTime(pbdt.replace(' ', 'T').replace('Z', ''));
}

export function formatPocketBaseReservation(reservation: ReservationsResponse) {
	const start = parsePocketBaseDateTime(reservation.start);
	const end = parsePocketBaseDateTime(reservation.end);
	const day = formatDay(start.toDate('Europe/Stockholm'));
	const startTime = toTime(start).toString().slice(0, 5);
	const endTime = toTime(end).toString().slice(0, 5);

	return `${day} ${startTime} - ${endTime}`;
}

export function getTodaysDate() {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();

	return new CalendarDate(year, month, day);
}

export function getCurrentTime() {
	return new DateFormatter('sv-SE', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(now(getLocalTimeZone()).toDate());
}

export function toDate(date: DateValue, tz = getLocalTimeZone()) {
	if (date instanceof ZonedDateTime) {
		return date.toDate();
	} else {
		return date.toDate(tz);
	}
}

export function formatDay(date: Date) {
	return new DateFormatter('sv-SE', { month: 'long', day: 'numeric' }).format(date);
}
