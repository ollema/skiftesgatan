<script>
	import '@fontsource-variable/lora';
	import '@fontsource-variable/nunito-sans';

	import '../app.postcss';

	import { SiteFooter, SiteHeader } from '$lib/components';

	import { ModeWatcher } from 'mode-watcher';

	export let data;

	// TODO: remove when it's not needed
	import { onMount } from 'svelte';
	import { mode } from 'mode-watcher';

	onMount(() => {
		const unsubscriber = mode.subscribe(() => {});
		return () => {
			unsubscriber();
		};
	});
</script>

<ModeWatcher />

<div class="relative flex min-h-screen flex-col">
	<SiteHeader user={data.user} />

	<div class="container min-h-[calc(100vh-3.5rem)]">
		<main class="p-6">
			<slot />
		</main>
	</div>

	<SiteFooter />
</div>
