<script lang="ts">
	import { invalidate } from '$app/navigation';
	import LaundryBookingCalendar from '$lib/components/calendars/laundry-booking-calendar.svelte';
	import { source } from 'sveltekit-sse';

	let { data } = $props();

	const now = $derived(data.now);
	const bookings = $derived(data.bookings);
	const userBooking = $derived(data.userBooking);

	const connection = source('/api/sse/bookings').select('bookings-updated');

	connection.subscribe((event) => {
		if (event) {
			invalidate('bookings:laundry');
		}
	});
</script>

<svelte:head>
	<title>Boka tvättstuga</title>
</svelte:head>

Senast uppdaterad: {now.toLocaleString()}

<LaundryBookingCalendar {now} {bookings} {userBooking} />
