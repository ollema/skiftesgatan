import { now as nowTZ, parseAbsolute, toCalendarDateTime } from '@internationalized/date';

export const timezone = 'Europe/Stockholm' as const;

/**
 * Get current timestamp in Stockholm timezone as ISO string (YYYY-MM-DDTHH:MM:SS)
 */
export function now(): string {
	return toCalendarDateTime(nowTZ(timezone)).toString().split('.')[0];
}

/**
 * Convert a Date object to ISO string in Stockholm timezone (YYYY-MM-DDTHH:MM:SS)
 */
export function dateToString(date: Date): string {
	const zonedDateTime = toCalendarDateTime(parseAbsolute(date.toISOString(), timezone));
	return zonedDateTime.toString().split('.')[0];
}
