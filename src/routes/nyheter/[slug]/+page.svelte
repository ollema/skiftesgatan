<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta data-key="description" name="description" content={data.meta.description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
	<meta name="twitter:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta name="twitter:description" content={data.meta.description} />
</svelte:head>

<h3 class="title">{data.meta.title}</h3>
<div class="meta">{data.meta.date}</div>
{@html data.content}

<style lang="postcss">
	.title {
		margin-bottom: var(--size-3);
	}

	.meta {
		color: var(--text-2);
		font-size: var(--font-size);

		margin-bottom: var(--size-2);
	}
</style>
