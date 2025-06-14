<script lang="ts">
	import LaundryBookingCalendar from '$lib/components/calendars/laundry-booking-calendar.svelte';

	let { data } = $props();

	const now = $derived(data.now);
	const bookings = $derived(data.bookings);
	const userBooking = $derived(data.userBooking);
</script>

<svelte:head>
	<title>Boka tvättstuga</title>
</svelte:head>

<LaundryBookingCalendar {now} {bookings} {userBooking} />
