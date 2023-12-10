<script lang="ts">
	import { enhance } from '$app/forms';
	import { toCalendarDateTime, type DateValue } from '@internationalized/date';
	import type { Timeslot } from './timeslots';
	import type { SerializableReservation } from './types';

	export let date: DateValue;
	export let timeslot: Timeslot;
	export let reservation: SerializableReservation | undefined;
	export let apartment: string | undefined;
	export let responsive = true;

	$: start = toCalendarDateTime(date, timeslot.start);
	$: end = toCalendarDateTime(date, timeslot.end);

	function hourToString(hour: number) {
		return hour.toString().padStart(2, '0');
	}

	$: reservedByApartment = reservation !== undefined && reservation.apartment === apartment;
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

<form method="POST" use:enhance action="?/{action}">
	<input type="hidden" name="start" value={start.toString() + 'Z'} />
	<input type="hidden" name="end" value={end.toString() + 'Z'} />

	<button
		class="flex h-4 w-12 items-center justify-center rounded-sm border border-dashed border-foreground/60 p-0 text-xs hover:border-solid"
		class:responsive-button={responsive}
		class:reserved-button={reservation}
		class:disabled-button={disabled}
		class:reserved-by-apartment={reservedByApartment}
		type="submit"
		{disabled}
	>
		{#if reservation}
			{reservation.apartment}
		{:else}
			{hourToString(timeslot.start.hour)} - {hourToString(timeslot.end.hour)}
		{/if}
	</button>
</form>

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
		@apply opacity-70;
	}

	.disabled-square {
		@apply opacity-70;
	}
</style>
