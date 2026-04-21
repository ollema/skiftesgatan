<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Update from 'svelte-radix/Update.svelte';
	import Calendar from './Calendar.svelte';

	import { getCurrentTime } from './helpers';

	import { active } from '$lib/active';
	import { invalidate } from '$app/navigation';
	import { browser } from '$app/environment';

	$: invalidatePeriodcally($active);

	let updated: string = getCurrentTime();
	let interval: ReturnType<typeof setInterval>;

	function invalidatePeriodcally(active: boolean) {
		if (active && browser) {
			clearInterval(interval);
			interval = setInterval(() => {
				invalidateData();
			}, 60 * 1000);
		} else {
			clearInterval(interval);
		}
	}

	function invalidateData() {
		invalidate('laundry:calendar').then(() => {
			updated = getCurrentTime();
		});
	}
</script>

<div class="mb-4 rounded-md border border-foreground/30 bg-foreground/5 p-3 text-sm">
	Bokningar kan endast göras till och med 26 april 2026. Från och med 27 april bokas tvättstugan
	på <a class="underline" href="https://skiftesgatan.se">skiftesgatan.se</a>.
</div>

<div class="mb-4 mt-[-0.75rem] flex items-center gap-2 sm:mb-1">
	<p class="text-sm">Senast uppdaterad {updated}</p>
	<Button class="h-fit p-1" on:click={invalidateData} variant="outline">
		<Update class="h-[14px] w-[14px]" />
	</Button>
</div>

<Calendar />
