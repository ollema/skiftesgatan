<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/merriweather';
	import '@fontsource/jetbrains-mono';
	import '../app.css';

	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import SiteFooter from '$lib/components/site-footer.svelte';

	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

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

<Toaster position="top-center" />

<ModeWatcher defaultMode="light" />

<div class="bg-background relative z-10 flex min-h-svh flex-col">
	<SiteHeader />
	<main class="flex flex-1 flex-col">
		<Tooltip.Provider>
			<div class="container font-serif">
				<div class="pt-4 lg:px-4">
					{@render children()}
				</div>
			</div>
		</Tooltip.Provider>
	</main>
	<SiteFooter />
</div>
