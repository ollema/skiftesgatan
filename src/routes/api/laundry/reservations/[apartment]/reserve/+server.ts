import { getApartment, reserve } from '$lib/pocketbase';
import { bookingsDisabled } from '$lib/pocketbase/reservations';

export const POST = async ({ request, locals, params }) => {
	if (bookingsDisabled()) {
		return new Response('Bookings are disabled — this site is being replaced.', { status: 410 });
	}

	const { start, end } = await request.json();
	const apartment = await getApartment(locals.pb, params.apartment);
	await reserve(locals.pb, apartment, start, end);

	return new Response('ok');
};
