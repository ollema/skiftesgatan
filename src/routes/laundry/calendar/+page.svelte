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

<div class="mb-4 mt-[-0.75rem] flex items-center gap-2 sm:mb-1">
	<p class="text-sm">Senast uppdaterad {updated}</p>
	<Button class="h-fit p-1" on:click={invalidateData} variant="outline">
		<Update class="h-[14px] w-[14px]" />
	</Button>
</div>

<Calendar />
