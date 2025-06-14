<script lang="ts">
	import BookingCalendar from '$lib/components/calendars/booking-calendar.svelte';
	import { source } from 'sveltekit-sse';
	import { invalidate } from '$app/navigation';
	import { BOOKING_CONFIG } from '$lib/constants/bookings';

	let { data } = $props();

	const bookingType = 'bbq' as const;
	const config = BOOKING_CONFIG[bookingType];
	const now = $derived(data.now);
	const bookings = $derived(data.bookings);
	const userBooking = $derived(data.userBooking);

	const connection = source(config.sseEndpoint).select(config.sseEventName);

	connection.subscribe((event) => {
		if (event) {
			invalidate(config.invalidationKey);
		}
	});
</script>

<svelte:head>
	<title>Boka grill</title>
</svelte:head>

Senast uppdaterad: {now.toLocaleString()}

<BookingCalendar {bookingType} {now} {bookings} {userBooking} />
