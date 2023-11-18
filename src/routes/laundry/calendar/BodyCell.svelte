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
	<div>
		{date.day}
	</div>
	<div>
		<div class="flex flex-col gap-[2px] p-[1px] min-[500px]:w-8 md:w-12">
			{#each timeslots as timeslot}
				<Timeslot {timeslot} selected={slotProps.selected} disabled={slotProps.disabled} />
			{/each}
		</div>
	</div>
</div>
