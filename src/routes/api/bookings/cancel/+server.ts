import { json, redirect } from '@sveltejs/kit';
import { route } from '$lib/routes';
import { cancelBooking, getBookingById } from '$lib/server/bookings';

export const POST = async (event) => {
	if (event.locals.session === null || event.locals.user === null) {
		redirect(302, route('/auth/sign-in'));
	}

	const { bookingId } = await event.request.json();

	const booking = getBookingById(bookingId);

	if (!booking) {
		return json({ message: 'Bokning kunde inte hittas' }, { status: 404 });
	}

	if (booking.userId !== event.locals.user.id) {
		return json(
			{ message: 'Du har inte behörighet att avboka den här bokningen' },
			{ status: 403 }
		);
	}

	const success = cancelBooking(bookingId);

	if (!success) {
		return json({ message: 'Kunde inte avboka den här bokningen' }, { status: 400 });
	}

	return json({ message: 'Bokning avbokad!' });
};
