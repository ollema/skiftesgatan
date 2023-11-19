<script lang="ts">
	import Timeslot from './Timeslot.svelte';
	import { melt } from '@melt-ui/svelte';
	import { getCtx, getAttrs } from '$lib/components/calendar/ctx';
	import type { DateProps } from '$lib/components/calendar/types';

	type $$Props = DateProps & {
		timeslots: { start: string; end: string }[];
	};

	export let date: $$Props['date'];
	export let month: $$Props['month'];
	export let timeslots: { start: string; end: string }[];

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
</script>

<div
	use:melt={builder}
	{...attrs}
	{...$$restProps}
	class="flex justify-between bg-background p-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground"
>
	<div class="h-[25px] grow-0 sm:h-20">
		{date.day}
	</div>

	{#if !slotProps.disabled}
		<div>
			<div class="flex h-full flex-col justify-center gap-[1px] sm:w-12 sm:gap-[4px]">
				{#each timeslots as timeslot}
					<Timeslot {timeslot} selected={slotProps.selected} disabled={slotProps.disabled} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	[data-melt-calendar-cell][data-selected] {
		@apply bg-foreground text-background;
	}

	[data-melt-calendar-cell][data-disabled] {
		@apply pointer-events-none bg-background/95 text-foreground/80;
	}

	[data-melt-calendar-cell][data-outside-visible-months] {
		@apply pointer-events-none cursor-default bg-background/80 text-foreground/70;
	}
</style>
