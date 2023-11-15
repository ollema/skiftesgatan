<script>
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';

	const title = 'BRF Skiftesgatan 4';
	const description = 'En bostadsrättsförening i Hisingen, Göteborg.';
</script>

<MetaTags {title} {description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{title}</PageHeader.Title>
		<PageHeader.Description>{description}</PageHeader.Description>
	</PageHeader.Heading>
</PageHeader.Root>
