<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Update } from 'radix-icons-svelte';
	import Calendar from './Calendar.svelte';

	import { getCurrentTime } from './helpers';

	import { active } from '$lib/active';
	import { invalidate } from '$app/navigation';

	$: invalidatePeriodcally($active);

	let updated: string = getCurrentTime();
	let interval: ReturnType<typeof setInterval>;

	function invalidateData() {
		invalidate('laundry:calendar').then(() => {
			updated = getCurrentTime();
		});
	}

	function invalidatePeriodcally(active: boolean) {
		if (active) {
			clearInterval(interval);
			interval = setInterval(() => {
				invalidateData();
			}, 60 * 1000);
		} else {
			clearInterval(interval);
		}
	}
</script>

<div class="mb-4 mt-[-0.5rem] flex items-center sm:mb-1">
	<p class="text-sm">Senast uppdaterad: {updated}</p>
	<Button class="p-3" on:click={invalidateData} variant="ghost">
		<Update class="h-[14px] w-[14px]" />
	</Button>
</div>

<Calendar />
