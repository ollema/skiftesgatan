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
	class="flex justify-between bg-background p-1 focus:ring focus:ring-foreground data-[disabled]:cursor-default data-[selected]:bg-foreground data-[disabled]:text-foreground/40 data-[selected]:text-background"
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
