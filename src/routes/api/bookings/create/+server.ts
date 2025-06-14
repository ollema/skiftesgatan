import { error, json, redirect } from '@sveltejs/kit';
import { parseDateTime } from '@internationalized/date';
import { route } from '$lib/routes';
import { createBooking } from '$lib/server/bookings';
import { BBQ_SLOT, BOOKING_TYPES, LAUNDRY_SLOTS } from '$lib/constants/bookings';

export const POST = async (event) => {
	if (event.locals.session === null || event.locals.user === null) {
		redirect(302, route('/auth/sign-in'));
	}

	const { start, end, bookingType } = await event.request.json();

	if (!BOOKING_TYPES.includes(bookingType)) {
		error(400, 'Invalid booking type');
	}

	let startDateTime, endDateTime;
	try {
		startDateTime = parseDateTime(start);
		endDateTime = parseDateTime(end);
	} catch {
		error(400, 'Invalid datetime format');
	}

	const startHour = startDateTime.hour;
	const endHour = endDateTime.hour;

	if (bookingType === 'laundry') {
		const validSlot = LAUNDRY_SLOTS.find(
			(slot) => slot.start === startHour && slot.end === endHour
		);
		if (!validSlot) {
			error(400, 'Invalid laundry time slot');
		}
	} else if (bookingType === 'bbq') {
		if (startHour !== BBQ_SLOT.start || endHour !== BBQ_SLOT.end) {
			error(400, 'Invalid BBQ time slot');
		}
	} else {
		error(400, 'Unsupported booking type');
	}

	createBooking(event.locals.user.id, bookingType, startDateTime, endDateTime);

	return json({ message: 'Booking created successfully' });
};
