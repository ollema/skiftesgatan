import { produce } from 'sveltekit-sse';
import { events } from '$lib/server/db/events';

export function POST() {
	return produce(function start({ emit }) {
		const handleLaundryBookingsUpdated = () => {
			const { error } = emit('laundry-bookings-updated', `${Date.now()}`);
			if (error) {
				console.error('SSE emit error:', error);
				return;
			}
		};

		events.on('laundry-bookings-updated', handleLaundryBookingsUpdated);

		return function stop() {
			events.off('laundry-bookings-updated', handleLaundryBookingsUpdated);
		};
	});
}
