<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';
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

	const title = 'Tvättstuga';
	const description = 'Bokade tider i vår tvättstuga';
</script>

<MetaTags {title} {description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{title}</PageHeader.Title>
		<PageHeader.Description>Senast uppdaterad: {updated}</PageHeader.Description>
	</PageHeader.Heading>
</PageHeader.Root>

<Calendar />
