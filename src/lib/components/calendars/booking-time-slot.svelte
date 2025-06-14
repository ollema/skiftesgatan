<script lang="ts" generics="T extends BookingType">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { route } from '$lib/routes';
	import type { BookingWithUser, BookingType } from '$lib/constants/bookings';
	import { cn } from '$lib/utils';
	import { CalendarDateTime, type DateValue } from '@internationalized/date';
	import { getFlash } from 'sveltekit-flash-message';
	import { BOOKING_CONFIG } from '$lib/constants/bookings';

	const flash = getFlash(page);

	interface Props {
		bookingType: T;
		date: DateValue;
		now: CalendarDateTime;
		timeslot: { start: number; end: number; label: string };
		booking: BookingWithUser | null;
		mobile?: boolean;
	}

	let { bookingType, date, now, timeslot, booking, mobile = false }: Props = $props();

	const config = $derived(BOOKING_CONFIG[bookingType]);

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
				const message = await response.text();
				console.error(`Kunde inte avboka ${config.bookingTerm} ${timeslot.label}: ${message}`);

				$flash = { type: 'error', message: message };

				invalidate(config.invalidationKey);
				event.stopPropagation();
				return;
			}

			$flash = {
				type: 'success',
				message: `Avbokat ${config.bookingTerm} ${date.toString()} ${timeslot.label.replace('-', ':00-').concat(':00')}`
			};

			invalidate(config.invalidationKey);
			event.stopPropagation();
			return;
		} else if (bookable) {
			const response = await fetch(route('POST /api/bookings/create'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					bookingType,
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
				console.error(`Kunde inte boka ${config.bookingTerm} ${timeslot.label}: ${message}`);

				$flash = { type: 'error', message: message };

				invalidate(config.invalidationKey);
				event.stopPropagation();
				return;
			}

			$flash = {
				type: 'success',
				message: `Bokat ${config.bookingTerm} ${date.toString()} ${timeslot.label.replace('-', ':00-').concat(':00')}`
			};

			invalidate(config.invalidationKey);
			event.stopPropagation();
			return;
		}
		event.stopPropagation();
	}
</script>

<div
	class={cn(
		'border-foreground/60 block h-[4px] w-[4px] items-center justify-end border sm:hidden',
		mobile && '!sm:block !hidden',
		booking && 'bg-foreground'
	)}
></div>

<button
	class={cn(
		'border-foreground/80 hidden h-4 w-12 cursor-pointer items-center justify-center rounded-sm border border-dashed p-0 text-xs hover:border-solid sm:flex',
		mobile && '!sm:hidden !flex',
		booking && ' bg-foreground hover:bg-foreground/20',
		!canInteract && 'cursor-default'
	)}
	onclick={handleClick}
>
	{timeslot.label}
</button>
