<script lang="ts">
	import Timeslot from './Timeslot.svelte';
	import type { Readable } from 'svelte/store';
	import { melt } from '@melt-ui/svelte';
	import type { DateValue, CalendarDate } from '@internationalized/date';

	type Month<T> = {
		value: DateValue;
		weeks: T[][];
		dates: T[];
	};

	export let date: DateValue;
	export let month: Month<DateValue>;
	export let todaysDate: CalendarDate;
	export let timeslots: { start: string; end: string }[];

	// from the melt-ui calendar builder
	export let isDateDisabled: Readable<(date: DateValue) => boolean | undefined>;
	export let isDateUnavailable: Readable<(date: DateValue) => boolean | undefined>;
	export let cell: any;
</script>

<td
	role="gridcell"
	aria-disabled={$isDateDisabled(date) || $isDateUnavailable(date)}
	class="bg-background"
>
	<div
		use:melt={$cell(date, month.value)}
		class="flex w-full cursor-pointer select-none items-center justify-center border-2 border-transparent hover:bg-accent/20 focus:border-foreground/60 data-[selected]:bg-foreground data-[selected]:text-background"
	>
		<div class="relative w-full">
			<div class="sm:absolute sm:left-[6px] sm:top-[1px] sm:h-4 sm:w-4 sm:text-left">
				{date.day}
			</div>
			<div class="hidden items-center justify-end p-1 sm:flex">
				<div class="flex w-8 flex-col gap-[2px] md:w-12">
					{#each timeslots as timeslot}
						<Timeslot {date} {todaysDate} {timeslot} />
					{/each}
				</div>
			</div>
		</div>
	</div>
</td>
