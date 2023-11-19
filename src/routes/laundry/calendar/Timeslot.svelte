<script lang="ts">
	import { Square } from 'radix-icons-svelte';
	import { enhance } from '$app/forms';
	import { toCalendarDateTime, type DateValue } from '@internationalized/date';
	import type { Timeslot } from './timeslots';
	import type { SerializableReservation } from './types';

	export let date: DateValue;
	export let timeslot: Timeslot;
	export let reservation: SerializableReservation | undefined;
	export let apartment: string | undefined;
	export let responsive = true;

	const start = toCalendarDateTime(date, timeslot.start);
	const end = toCalendarDateTime(date, timeslot.end);

	function hourToString(hour: number) {
		return hour.toString().padStart(2, '0');
	}

	$: responsiveSquareClass = responsive ? 'sm:hidden' : 'hidden';
	$: reservedSquareClass = reservation ? 'bg-background' : '';

	$: disabled = reservation !== undefined && reservation.apartment !== apartment;
</script>

<div class="flex justify-end {responsiveSquareClass} {reservedSquareClass}">
	<Square class="h-[5px] w-[5px]" />
</div>

<form method="POST" use:enhance action="?/reserve">
	<input type="hidden" name="start" value={start.toString() + 'Z'} />
	<input type="hidden" name="end" value={end.toString() + 'Z'} />

	<button
		class="flex h-4 w-12 items-center justify-center rounded-sm border border-dashed p-0 text-xs hover:border-solid"
		class:responsive-button={responsive}
		class:reserved-button={reservation}
		class:disabled-button={disabled}
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
	.responsive-button {
		@apply hidden sm:block;
	}

	.reserved-button {
		@apply border-solid bg-foreground text-background opacity-100;
	}

	.disabled-button {
		@apply opacity-70;
	}
</style>
