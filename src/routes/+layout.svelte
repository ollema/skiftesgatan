<script lang="ts">
	import '@fontsource-variable/lora';
	import '@fontsource-variable/nunito-sans';

	import '../app.postcss';

	import { SiteFooter, SiteHeader } from '$lib/components';
	import * as PageHeader from '$lib/components/page-header';

	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.data.meta.title}</title>
	<meta name="description" content={$page.data.meta.description} />
	<link rel="canonical" href={$page.url.toString()} />
	<meta property="og:title" content={$page.data.meta.title} />
	<meta property="og:description" content={$page.data.meta.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.toString()} />
	<meta property="og:image" content="https://skiftesgatan.server.ollema.xyz/og.png" />
	<meta property="og:image:alt" content="BRF Skiftesgatan 4 logo" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<SiteHeader />

	<div class="container min-h-[calc(100vh-3.5rem)]">
		<main class="py-6">
			<PageHeader.Root>
				<PageHeader.Heading>
					<PageHeader.Title>{$page.data.meta.title}</PageHeader.Title>
					{#if $page.data.meta.description}
						<PageHeader.Description>{$page.data.meta.description}</PageHeader.Description>
					{/if}
				</PageHeader.Heading>
			</PageHeader.Root>

			<slot />
		</main>
	</div>

	<SiteFooter />
</div>
