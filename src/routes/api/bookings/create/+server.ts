import { json, redirect } from '@sveltejs/kit';
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
		return json({ status: 'error', message: 'Ogiltig bokningstyp' }, { status: 400 });
	}

	let startDateTime, endDateTime;
	try {
		startDateTime = parseDateTime(start);
		endDateTime = parseDateTime(end);
	} catch {
		return json({ status: 'error', message: 'Ogiltigt datumformat' }, { status: 400 });
	}

	const startHour = startDateTime.hour;
	const endHour = endDateTime.hour;

	if (bookingType === 'laundry') {
		const validSlot = LAUNDRY_SLOTS.find(
			(slot) => slot.start === startHour && slot.end === endHour
		);
		if (!validSlot) {
			return json({ status: 'error', message: 'Ogiltig tvättid' }, { status: 400 });
		}
	} else if (bookingType === 'bbq') {
		if (startHour !== BBQ_SLOT.start || endHour !== BBQ_SLOT.end) {
			return json({ status: 'error', message: 'Ogiltig uteplatstid' }, { status: 400 });
		}
	} else {
		return json({ status: 'error', message: 'Okänd bokningstyp' }, { status: 400 });
	}

	try {
		createBooking(event.locals.user.id, bookingType, startDateTime, endDateTime);
	} catch (err) {
		if (err instanceof Error) {
			return json({ status: 'error', message: err.message }, { status: 500 });
		} else {
			return json({ status: 'error', message: 'Ett oväntat fel inträffade' }, { status: 500 });
		}
	}

	return json({ status: 'success', message: 'Bokning skapad!' });
};
