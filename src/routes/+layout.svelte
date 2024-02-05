<script lang="ts">
	import '@fontsource-variable/lora';
	import '@fontsource-variable/nunito-sans';

	import '../app.postcss';

	import { MetaTags, type MetaTagsProps } from 'svelte-meta-tags';

	import extend from 'just-extend';
	import { page } from '$app/stores';
	import { SiteFooter, SiteHeader } from '$lib/components';
	import * as PageHeader from '$lib/components/page-header';

	export let data;

	let meta: MetaTagsProps;
	$: meta = extend(true, {}, data.meta, $page.data.meta);
</script>

<MetaTags {...meta} />

<div class="relative flex min-h-screen flex-col">
	<SiteHeader />

	<div class="container min-h-[calc(100vh-3.5rem)]">
		<main class="py-6">
			<PageHeader.Root>
				<PageHeader.Heading>
					<PageHeader.Title>{meta.title}</PageHeader.Title>
					{#if meta.description}
						<PageHeader.Description>{meta.description}</PageHeader.Description>
					{/if}
				</PageHeader.Heading>
			</PageHeader.Root>

			<slot />
		</main>
	</div>

	<SiteFooter />
</div>
