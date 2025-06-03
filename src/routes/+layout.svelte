<script lang="ts">
	import '../app.css';

	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Logo from '$lib/components/logo.svelte';

	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';

	const isMobile = new IsMobile();

	let { children } = $props();
</script>

<Sidebar.Provider open={false}>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="bg-background sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4"
		>
			<a
				class="text-foreground mr-6 flex flex-shrink-0 items-center text-2xl font-black hover:underline"
				href="/"
			>
				<div>Skiftesgatan</div>
				<Logo />
			</a>
			{#if isMobile.current}
				<Sidebar.Trigger class="-ml-1" />
			{/if}
		</header>
		<main>
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
