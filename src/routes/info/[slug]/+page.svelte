<script>
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';

	export let data;
</script>

<MetaTags title={data.page.title} description={data.page.description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{data.page.title}</PageHeader.Title>
		<PageHeader.Description>{data.page.description}</PageHeader.Description>
	</PageHeader.Heading>
</PageHeader.Root>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html data.page.content}
