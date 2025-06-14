import { EventEmitter } from 'node:events';
import type { BookingType } from '$lib/constants/bookings';

class DatabaseEventEmitter extends EventEmitter {
	private debounceTimers: Map<BookingType, NodeJS.Timeout> = new Map();

	emitBookingsUpdated(bookingType: BookingType) {
		const existingTimer = this.debounceTimers.get(bookingType);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const timer = setTimeout(() => {
			this.emit(`${bookingType}-bookings-updated`);
			this.debounceTimers.delete(bookingType);
		}, 100);

		this.debounceTimers.set(bookingType, timer);
	}
}

export const events = new DatabaseEventEmitter();
