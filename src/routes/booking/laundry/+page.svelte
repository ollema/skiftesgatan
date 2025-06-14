<script lang="ts">
	import LaundryBookingCalendar from '$lib/components/calendars/laundry-booking-calendar.svelte';

	let { data } = $props();

	const today = $derived(data.today);
	const bookings = $derived(data.bookings);
</script>

<svelte:head>
	<title>Boka tvättstuga</title>
</svelte:head>

<LaundryBookingCalendar {today} {bookings} />
