<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import type { ComponentType } from 'svelte';
	import GoogleIcon from './GoogleIcon.svelte';
	import FacebookIcon from './FacebookIcon.svelte';
	const icons: { [key: string]: ComponentType } = { google: GoogleIcon, facebook: FacebookIcon };

	export let data;
</script>

<div class="flex flex-col items-center justify-center pt-8">
	<p class="mb-4">Logga in med ett av följande konton:</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		{#each data.providers as provider}
			<Button variant="outline" class="w-32" href={`/auth/signin/${provider.name}`}>
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
