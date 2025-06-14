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
		return json({ message: 'Booking not found' }, { status: 404 });
	}

	if (booking.userId !== event.locals.user.id) {
		return json({ message: 'Unauthorized to cancel this booking' }, { status: 403 });
	}

	const success = cancelBooking(bookingId);

	if (!success) {
		return json({ message: 'Failed to cancel booking' }, { status: 400 });
	}

	return json({ message: 'Booking cancelled successfully' });
};
