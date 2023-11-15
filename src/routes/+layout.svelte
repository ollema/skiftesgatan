<script>
	import '@fontsource-variable/lora';
	import '@fontsource-variable/nunito-sans';

	import '../app.postcss';

	import { SiteFooter, SiteHeader } from '$lib/components';

	import { ModeWatcher } from 'mode-watcher';

	export let data;
</script>

<ModeWatcher />

<div class="relative flex min-h-screen flex-col">
	<SiteHeader user={data.user} apartment={data.apartment} />

	<div class="container min-h-[calc(100vh-3.5rem)]">
		<main class="py-6">
			<slot />
		</main>
	</div>

	<SiteFooter />
</div>
