<script>
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';
	import Calendar from './Calendar.svelte';

	const title = 'Tvättstuga - bokningar';
	const description = 'Bokade tider i vår tvättstuga';
</script>

<MetaTags {title} {description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{title}</PageHeader.Title>
		<PageHeader.Description>{description}</PageHeader.Description>
	</PageHeader.Heading>
</PageHeader.Root>

<Calendar />
