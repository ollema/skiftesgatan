import { redirect } from '@sveltejs/kit';
import { parseDateTime } from '@internationalized/date';
import { getBookings, getFutureBookingsPerUser } from '$lib/server/bookings';
import { now as rightNow } from '$lib/datetime';
import { route } from '$lib/routes';

export const load = (event) => {
	event.depends('bookings:laundry');

	if (event.locals.session === null || event.locals.user === null) {
		redirect(302, route('/auth/sign-in'));
	}

	const now = parseDateTime(rightNow());

	const startDate = now.subtract({ days: 1 });
	const endDate = now.add({ months: 1, days: 1 });

	const bookings = getBookings('laundry', startDate, endDate);

	const userBookings = getFutureBookingsPerUser(event.locals.user.id, 'laundry');
	if (userBookings && userBookings.length > 1) {
		console.warn(
			`found more than one future booking for user ${event.locals.user.id} in laundry bookings`
		);
	}

	const userBooking = userBookings && userBookings[0];

	return {
		user: event.locals.user,
		now: now,
		bookings,
		userBooking
	};
};
