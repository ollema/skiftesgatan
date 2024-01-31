<script lang="ts">
	import Timeslot from './Timeslot.svelte';
	import { isToday, type DateValue } from '@internationalized/date';
	import { timeslots } from './timeslots';
	import type { SerializableReservationMap } from './types';
	import { builderActions, getAttrs, type Builder } from 'bits-ui';
	import type { Apartment } from '$lib/types';

	export let date: DateValue;
	export let disabled: boolean;
	export let reservations: SerializableReservationMap | undefined;
	export let apartment: Apartment | undefined;
	export let builders: Builder[] = [];

	$: today = isToday(date, 'Europe/Stockholm');
</script>

<button
	use:builderActions={{ builders }}
	{...getAttrs(builders)}
	class="flex w-full items-center justify-between bg-background p-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/60"
>
	<div class="h-[25px] grow-0 text-xs sm:h-20 sm:text-base">
		<div class:today>
			{date.day}
		</div>
	</div>

	{#if !disabled}
		<div>
			<div class="flex h-full flex-col justify-center gap-[1px] sm:gap-[4px]">
				{#each timeslots as timeslot}
					<Timeslot
						{date}
						{timeslot}
						reservation={reservations ? reservations[timeslot.start.toString()] : undefined}
						{apartment}
					/>
				{/each}
			</div>
		</div>
	{/if}
</button>

<style lang="postcss">
	.today {
		@apply flex h-4 w-4 items-center justify-center rounded-md bg-foreground text-center text-background sm:h-5 sm:w-5;
	}

	[data-melt-calendar-cell][data-selected] {
		@apply ring-2 ring-inset ring-foreground;
	}

	[data-melt-calendar-cell][data-disabled] {
		@apply pointer-events-none text-foreground/70;
	}

	[data-melt-calendar-cell][data-outside-visible-months] {
		@apply pointer-events-none cursor-default bg-background/80 text-foreground/70;
	}
</style>
