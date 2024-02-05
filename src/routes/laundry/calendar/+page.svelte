<script lang="ts">
	import Calendar from './Calendar.svelte';

	import { getCurrentTime } from './helpers';

	import { active } from '$lib/active';
	import { invalidate } from '$app/navigation';

	$: invalidatePeriodcally($active);

	let updated: string = getCurrentTime();
	let interval: ReturnType<typeof setInterval>;
	function invalidatePeriodcally(active: boolean) {
		if (active) {
			clearInterval(interval);
			interval = setInterval(() => {
				invalidate('laundry:calendar').then(() => {
					updated = getCurrentTime();
				});
			}, 60 * 1000);
		} else {
			clearInterval(interval);
		}
	}
</script>

<p class="mt-[-0.5rem] text-sm">Senast uppdaterad: {updated}</p>

<Calendar />
