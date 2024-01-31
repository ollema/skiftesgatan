<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';

	import GoogleIcon from './GoogleIcon.svelte';
	import FacebookIcon from './FacebookIcon.svelte';
	import { signin } from '$lib/pocketbase';

	const providers = [
		{ name: 'google', label: 'Logga in med Google', icon: GoogleIcon },
		{ name: 'facebook', label: 'Logga in med Facebook', icon: FacebookIcon }
	];

	const title = 'Logga in';
	const description = 'Logga in som boende i BRF Skiftesgatan 4';
</script>

<MetaTags {title} {description} />

<div class="flex flex-col items-center justify-center pt-8">
	<h2 class="mb-2">Logga in</h2>

	<p class="mb-4">Logga in med ett av följande konton:</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		{#each providers as provider}
			<Button variant="outline" class="w-52" on:click={async () => signin(provider.name)}>
				<div class="mr-2 h-4 w-4">
					<svelte:component this={provider.icon} />
				</div>
				<div class="font-sans font-semibold">
					{provider.label}
				</div>
			</Button>
		{/each}
	</div>
</div>
