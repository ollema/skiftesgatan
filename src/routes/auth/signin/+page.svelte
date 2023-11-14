<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import GoogleIcon from './GoogleIcon.svelte';
	import FacebookIcon from './FacebookIcon.svelte';

	const providers = [
		{ name: 'google', label: 'Logga in med Google', icon: GoogleIcon },
		{ name: 'facebook', label: 'Logga in med Facebook', icon: FacebookIcon }
	];
</script>

<div>
	<h2>Logga in</h2>

	<p>Logga in med ett av följande konton:</p>

	<div class="flex gap-3">
		{#each providers as provider}
			<form method="post">
				<input type="hidden" name="authProvider" value={provider.name} />
				<Button variant="outline" class="flex gap-2" type="submit">
					<div class="h-4 w-4">
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
