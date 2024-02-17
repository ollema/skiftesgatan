<script lang="ts">
	import { toCalendarDateTime, type DateValue } from '@internationalized/date';
	import type { Timeslot } from './timeslots';
	import type { SerializableReservation } from './types';
	import { release, reserve, pb } from '$lib/pocketbase';
	import type { ApartmentsResponse } from '$lib/pocketbase-types';
	import { invalidate } from '$app/navigation';

	export let date: DateValue;
	export let timeslot: Timeslot;
	export let reservation: SerializableReservation | undefined;
	export let apartment: ApartmentsResponse | undefined;
	export let responsive = true;

	import { PUBLIC_ADAPTER } from '$env/static/public';

	let start = toCalendarDateTime(date, timeslot.start);
	let end = toCalendarDateTime(date, timeslot.end);

	function hourToString(hour: number) {
		return hour.toString().padStart(2, '0');
	}

	async function handleClick(action: string) {
		if (apartment && action === 'reserve') {
			const startTime = start.toString() + 'Z';
			const endTime = end.toString() + 'Z';

			if (PUBLIC_ADAPTER === 'node') {
				const response = await fetch(`/api/laundry/reservations/${apartment.apartment}/reserve`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ start: startTime, end: endTime })
				});
				if (!response.ok) {
					console.error('failed to reserve laundry time slot:', response);
					throw new Error('failed to reserve laundry time slot');
				}
			} else {
				await reserve(pb, apartment, startTime, endTime);
			}
		}

		if (apartment && action === 'release') {
			if (PUBLIC_ADAPTER === 'node') {
				const response = await fetch(`/api/laundry/reservations/${apartment.apartment}/release`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				});
				if (!response.ok) {
					console.error('failed to release laundry time slot:', response);
					throw new Error('failed to release laundry time slot');
				}
			} else {
				await release(pb, apartment);
			}
		}

		await invalidate('laundry:calendar');
	}

	$: reservedByApartment =
		reservation !== undefined && reservation.apartment === apartment?.apartment;
	$: disabled = reservation !== undefined && !reservedByApartment;
	$: action = reservation !== undefined ? 'release' : 'reserve';
</script>

<div
	class="hidden h-[4px] w-[4px] items-center justify-end border border-foreground/60"
	class:responsive-square={responsive}
	class:reserved-square={reservation}
	class:disabled-square={disabled}
	class:reserved-by-apartment={reservedByApartment}
></div>

<input type="hidden" name="start" value={start.toString() + 'Z'} />
<input type="hidden" name="end" value={end.toString() + 'Z'} />

<button
	class="flex h-4 w-12 items-center justify-center rounded-sm border border-dashed border-foreground/80 p-0 text-xs hover:border-solid"
	class:responsive-button={responsive}
	class:reserved-button={reservation}
	class:disabled-button={disabled}
	class:reserved-by-apartment={reservedByApartment}
	type="submit"
	{disabled}
	on:click={() => handleClick(action)}
>
	{#if reservation}
		{reservation.apartment}
	{:else}
		{hourToString(timeslot.start.hour)} - {hourToString(timeslot.end.hour)}
	{/if}
</button>

<style lang="postcss">
	.responsive-square {
		@apply flex sm:hidden;
	}

	.responsive-button {
		@apply hidden sm:block;
	}

	.reserved-button {
		@apply border-solid bg-foreground text-background opacity-100;
	}

	.reserved-square {
		@apply bg-foreground;
	}

	.reserved-by-apartment {
		@apply border-[#d25e2b] bg-[#d25e2b];
	}

	.disabled-button {
		@apply opacity-80;
	}

	.disabled-square {
		@apply opacity-80;
	}
</style>
