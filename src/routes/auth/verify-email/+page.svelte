<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import VerifyForm from './verify-form.svelte';
	import ResendForm from './resend-form.svelte';

	let { data } = $props();
</script>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Verifiera din e-postadress</Card.Title>
			<Card.Description>Vi skickade en 8-siffrig kod till {data.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<VerifyForm verifyForm={data.verifyForm} />

			<div class="mt-4">
				<ResendForm resendForm={data.resendForm} />
			</div>
		</Card.Content>
	</Card.Root>
</div>
