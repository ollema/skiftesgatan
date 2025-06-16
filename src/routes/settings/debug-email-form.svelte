<script lang="ts">
	import * as Button from '$lib/components/ui/button';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { debugEmailFormSchema } from './schema';
	import { route } from '$lib/routes';

	let { debugEmailForm } = $props();

	const { enhance, submitting } = superForm(debugEmailForm, {
		validators: zodClient(debugEmailFormSchema)
	});
</script>

<form method="POST" action={route('debugEmail /settings')} use:enhance>
	<Button.Root type="submit" variant="outline" disabled={$submitting}>
		{#if $submitting}
			Skickar...
		{:else}
			Skicka test-email
		{/if}
	</Button.Root>
</form>
