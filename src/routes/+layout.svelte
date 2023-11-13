<script>
	import '../app.postcss';

	import { SiteFooter, SiteHeader } from '$lib/components';

	import { ModeWatcher } from 'mode-watcher';

	export let data;
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
