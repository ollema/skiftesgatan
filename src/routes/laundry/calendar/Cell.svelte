<script lang="ts">
	import Timeslot from './Timeslot.svelte';
	import { melt } from '@melt-ui/svelte';
	import { getCtx, getAttrs } from '$lib/components/calendar/ctx';
	import type { DateProps } from '$lib/components/calendar/types';
	import { isToday } from '@internationalized/date';
	import { timeslots } from './timeslots';
	import type { SerializableReservationMap } from './types';

	type $$Props = DateProps & {
		reservations: SerializableReservationMap | undefined;
		apartment: string | undefined;
	};

	export let date: $$Props['date'];
	export let month: $$Props['month'];
	export let reservations: SerializableReservationMap | undefined;
	export let apartment: string | undefined;

	const {
		elements: { cell },
		helpers: { isDateDisabled, isDateUnavailable, isDateSelected }
	} = getCtx();

	$: builder = $cell(date, month);
	const attrs = getAttrs('date');

	$: slotProps = {
		builder,
		attrs,
		disabled: $isDateDisabled(date),
		unavailable: $isDateUnavailable(date),
		selected: $isDateSelected(date)
	};

	$: today = isToday(date, 'Europe/Stockholm');
</script>

<div
	use:melt={builder}
	{...attrs}
	{...$$restProps}
	class="flex justify-between bg-background p-1 transition duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/60"
>
	<div class="h-[25px] grow-0 text-xs sm:h-20 sm:text-base">
		<div class:today>
			{date.day}
		</div>
	</div>

	{#if !slotProps.disabled}
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
</div>

<style lang="postcss">
	.today {
		@apply flex h-4 w-4 items-center justify-center rounded-md bg-foreground text-center text-background sm:h-5 sm:w-5;
	}

	[data-melt-calendar-cell][data-selected] {
		@apply ring-2 ring-inset ring-foreground;
	}

	[data-melt-calendar-cell][data-disabled] {
		@apply pointer-events-none bg-background/95 text-foreground/80;
	}

	[data-melt-calendar-cell][data-outside-visible-months] {
		@apply pointer-events-none cursor-default bg-background/80 text-foreground/70;
	}
</style>
