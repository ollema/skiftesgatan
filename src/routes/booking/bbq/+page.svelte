<script lang="ts">
	import BBQBookingCalendar from '$lib/components/calendars/bbq-booking-calendar.svelte';
	import { source } from 'sveltekit-sse';
	import { invalidate } from '$app/navigation';

	let { data } = $props();

	const now = $derived(data.now);
	const bookings = $derived(data.bookings);
	const userBooking = $derived(data.userBooking);

	const connection = source('/api/sse/bookings/bbq').select('bbq-bookings-updated');

	connection.subscribe((event) => {
		if (event) {
			invalidate('bookings:bbq');
		}
	});
</script>

<svelte:head>
	<title>Boka grill</title>
</svelte:head>

Senast uppdaterad: {now.toLocaleString()}

<BBQBookingCalendar {now} {bookings} {userBooking} />
