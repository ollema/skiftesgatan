<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { MetaTags } from 'svelte-meta-tags';

	import { getRedirectUrl, setProvider } from '$lib/pocketbase';

	import type { ComponentType } from 'svelte';
	import GoogleIcon from './GoogleIcon.svelte';
	import FacebookIcon from './FacebookIcon.svelte';
	const icons: { [key: string]: ComponentType } = { google: GoogleIcon, facebook: FacebookIcon };

	export let data;

	const title = 'Logga in';
	const description = 'Logga in som boende i BRF Skiftesgatan 4';
</script>

<MetaTags {title} {description} />

<div class="flex flex-col items-center justify-center pt-8">
	<h2 class="mb-2">Logga in</h2>

	<p class="mb-4">Logga in med ett av följande konton:</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		{#each data.providers as provider}
			<Button
				variant="outline"
				class="w-32"
				href={provider.authUrl + getRedirectUrl()}
				on:click={async () => setProvider(provider)}
			>
				<div class="mr-2 h-4 w-4">
					<svelte:component this={icons[provider.name]} />
				</div>
				<div class="font-sans font-semibold">
					{provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
				</div>
			</Button>
		{/each}
	</div>
</div>
