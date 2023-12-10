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

<article class="content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.page.content}
</article>

<style lang="postcss">
	:global(article > *) {
		font-family: 'Lora Variable', serif !important;
	}

	:global(h4) {
		margin-top: 1rem !important;
	}

	:global(ul) {
		list-style: square !important ;
	}

	:global(ul > li) {
		margin-left: 1.5rem !important;
	}
</style>
