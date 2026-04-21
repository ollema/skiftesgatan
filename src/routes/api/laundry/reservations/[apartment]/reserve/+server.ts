import { getApartment, reserve } from '$lib/pocketbase';
import { timeslotBlocked } from '$lib/pocketbase/reservations';

export const POST = async ({ request, locals, params }) => {
	const { start, end } = await request.json();

	if (timeslotBlocked(start)) {
		return new Response('Bookings for this date are disabled — this site is being replaced.', {
			status: 410
		});
	}

	const apartment = await getApartment(locals.pb, params.apartment);
	await reserve(locals.pb, apartment, start, end);

	return new Response('ok');
};
