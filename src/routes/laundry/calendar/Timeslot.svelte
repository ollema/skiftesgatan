<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { CalendarDate, DateValue } from '@internationalized/date';

	export let date: DateValue;
	export let todaysDate: CalendarDate;
	export let timeslot: { start: string; end: string };
</script>

{#if date >= todaysDate}
	<Button
		variant="ghost"
		class="h-4 rounded-sm border border-dashed p-0 text-xs hover:border-solid"
	>
		<div class="hidden min-[500px]:block md:hidden">
			{timeslot.start.replace(':00', '')}
		</div>
		<div class="hidden md:block">
			{timeslot.start.replace(':00', '')} - {timeslot.end.replace(':00', '')}
		</div>
	</Button>
{:else}
	<Button variant="ghost" class="h-4 border border-dashed p-0 text-xs" disabled={true} />
{/if}
