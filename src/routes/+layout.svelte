<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/merriweather';
	import '../app.css';

	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import NavigationMenu from '$lib/components/navigation-menu.svelte';
	import PageContainer from '$lib/components/page-container.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';

	const flash = getFlash(page);

	$effect(() => {
		if (!$flash) return;

		if ($flash.type === 'error') {
			toast.error($flash.message);
		} else if ($flash.type === 'success') {
			toast.success($flash.message);
		} else {
			toast($flash.message);
		}

		$flash = undefined;
	});

	let { children } = $props();
</script>

<Toaster />

<ModeWatcher defaultMode="light" />

<Sidebar.Provider open={false}>
	<AppSidebar />
	<Sidebar.Inset>
		<NavigationMenu />
		<PageContainer>
			{@render children()}
		</PageContainer>
	</Sidebar.Inset>
</Sidebar.Provider>
