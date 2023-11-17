<script lang="ts">
	import Timeslot from './Timeslot.svelte';
	import type { CalendarDate, DateValue } from '@internationalized/date';

	export let date: DateValue;
	export let todaysDate: CalendarDate;
	export let timeslots: { start: string; end: string }[];
</script>

<div class="relative w-full">
	<div class="sm:absolute sm:left-[6px] sm:top-[1px] sm:h-4 sm:w-4 sm:text-left">{date.day}</div>
	<div class="hidden items-center justify-end p-1 sm:flex">
		<div class="flex w-8 flex-col gap-[2px] md:w-12">
			{#each timeslots as timeslot}
				<Timeslot {date} {todaysDate} {timeslot} />
			{/each}
		</div>
	</div>
</div>
