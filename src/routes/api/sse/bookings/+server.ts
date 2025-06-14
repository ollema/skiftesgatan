import { produce } from 'sveltekit-sse';
import { events } from '$lib/server/db/events';

export function POST() {
	return produce(function start({ emit }) {
		const handleBookingsUpdated = () => {
			const { error } = emit('bookings-updated', `${Date.now()}`);
			if (error) {
				console.error('SSE emit error:', error);
				return;
			}
		};

		events.on('bookings-updated', handleBookingsUpdated);

		return function stop() {
			events.off('bookings-updated', handleBookingsUpdated);
		};
	});
}
