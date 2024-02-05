<script lang="ts">
	import '@fontsource-variable/lora';
	import '@fontsource-variable/nunito-sans';

	import '../app.postcss';

	import { SiteFooter, SiteHeader } from '$lib/components';
	import * as PageHeader from '$lib/components/page-header';

	import { page } from '$app/stores';
</script>

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
