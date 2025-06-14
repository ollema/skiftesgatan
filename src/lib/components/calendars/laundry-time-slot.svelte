<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { route } from '$lib/routes';
	import type { BookingWithUser } from '$lib/types/bookings';
	import { cn } from '$lib/utils';
	import { CalendarDateTime, type DateValue } from '@internationalized/date';
	import { getFlash } from 'sveltekit-flash-message';

	const flash = getFlash(page);

	interface Props {
		date: DateValue;
		now: CalendarDateTime;
		timeslot: { start: number; end: number; label: string };
		booking: BookingWithUser | null;
	}

	let { date, now, timeslot, booking }: Props = $props();

	const startDateTime = $derived(
		new CalendarDateTime(date.year, date.month, date.day, timeslot.start, 0, 0)
	);

	const bookable = $derived(booking === null && startDateTime > now);
	const reservedByUser = $derived(booking !== null && booking.userId === page.data.user?.id);
	const canInteract = $derived(bookable || reservedByUser);

	async function handleClick(event: MouseEvent) {
		if (booking && reservedByUser) {
			const response = await fetch(route('POST /api/bookings/cancel'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					bookingId: booking.id
				})
			});
			if (!response.ok) {
				const errorMessage = await response.text();
				console.error(
					`Failed to cancel booking: ${booking.id}, status: ${response.status}, ${errorMessage}`
				);

				$flash = {
					type: 'error',
					message: `Kunde inte avboka tvätttid ${date.toString()} ${timeslot.label.replace('-', ':00-').concat(':00')}`
				};

				invalidate('bookings:laundry');
				return;
			}

			$flash = {
				type: 'success',
				message: `Avbokat tvätttid ${date.toString()} ${timeslot.label.replace('-', ':00-').concat(':00')}`
			};

			invalidate('bookings:laundry');
		} else if (bookable) {
			const response = await fetch(route('POST /api/bookings/create'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					bookingType: 'laundry',
					start: new CalendarDateTime(
						date.year,
						date.month,
						date.day,
						timeslot.start,
						0,
						0
					).toString(),
					end: new CalendarDateTime(date.year, date.month, date.day, timeslot.end, 0, 0).toString()
				})
			});
			if (!response.ok) {
				const { message } = await response.json();
				console.error(`Kunde inte boka tvättid ${timeslot.label}: ${message}`);

				$flash = { type: 'error', message: message };

				invalidate('bookings:laundry');
				return;
			}

			$flash = {
				type: 'success',
				message: `Bokat tvätttid ${date.toString()} ${timeslot.label.replace('-', ':00-').concat(':00')}`
			};

			invalidate('bookings:laundry');
		}
		event.stopPropagation();
	}
</script>

<div
	class="border-foreground/60 block h-[4px] w-[4px] items-center justify-end border sm:hidden"
></div>

<button
	class={cn(
		'border-foreground/80 hidden h-4 w-12 cursor-pointer items-center justify-center rounded-sm border border-dashed p-0 text-xs hover:border-solid sm:flex',
		booking && ' bg-foreground hover:bg-foreground/20',
		!canInteract && 'cursor-default'
	)}
	onclick={handleClick}
>
	{timeslot.label}
</button>
