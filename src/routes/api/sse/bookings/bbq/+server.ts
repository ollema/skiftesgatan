import { produce } from 'sveltekit-sse';
import { events } from '$lib/server/db/events';

export function POST() {
	return produce(function start({ emit }) {
		const handleBbqBookingsUpdated = () => {
			const { error } = emit('bbq-bookings-updated', `${Date.now()}`);
			if (error) {
				console.error('SSE emit error:', error);
				return;
			}
		};

		events.on('bbq-bookings-updated', handleBbqBookingsUpdated);

		return function stop() {
			events.off('bbq-bookings-updated', handleBbqBookingsUpdated);
		};
	});
}
