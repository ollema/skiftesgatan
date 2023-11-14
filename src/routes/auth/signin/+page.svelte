<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import GoogleIcon from './GoogleIcon.svelte';
	import FacebookIcon from './FacebookIcon.svelte';

	const providers = [
		{ name: 'google', label: 'Logga in med Google', icon: GoogleIcon },
		{ name: 'facebook', label: 'Logga in med Facebook', icon: FacebookIcon }
	];
</script>

<div class="flex flex-col items-center justify-center pt-8">
	<h2 class="mb-2">Logga in</h2>

	<p class="mb-4">Logga in med ett av följande konton:</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		{#each providers as provider}
			<form method="post">
				<input type="hidden" name="authProvider" value={provider.name} />
				<Button variant="outline" class="w-52" type="submit">
					<div class="mr-2 h-4 w-4">
						<svelte:component this={provider.icon} />
					</div>
					<div class="font-sans font-semibold">
						{provider.label}
					</div>
				</Button>
			</form>
		{/each}
	</div>
</div>
