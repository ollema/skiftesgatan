import { EventEmitter } from 'node:events';

class DatabaseEventEmitter extends EventEmitter {
	private debounceTimer: NodeJS.Timeout | null = null;

	emitBookingsUpdated() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.emit('bookings-updated');
			this.debounceTimer = null;
		}, 100);
	}
}

export const events = new DatabaseEventEmitter();
