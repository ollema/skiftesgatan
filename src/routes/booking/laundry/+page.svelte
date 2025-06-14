<script lang="ts">
	import LaundryBookingCalendar from '$lib/components/calendars/laundry-booking-calendar.svelte';
	import { source } from 'sveltekit-sse';
	import { invalidate } from '$app/navigation';

	let { data } = $props();

	const now = $derived(data.now);
	const bookings = $derived(data.bookings);
	const userBooking = $derived(data.userBooking);

	const connection = source('/api/sse/bookings/laundry').select('laundry-bookings-updated');

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
