<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { route } from '$lib/routes';

	let { form } = $props();
</script>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Glömt ditt lösenord?</Card.Title>
			<Card.Description>Ange ditt lägenhetsnummer för att återställa ditt lösenord</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action={route('default /auth/forgot-password')}
				class="grid gap-4"
				use:enhance
			>
				<div class="grid gap-2">
					<Label for="apartment">Lägenhetsnummer</Label>
					<Input
						id="apartment"
						name="apartment"
						type="text"
						placeholder="A1001"
						required
						value={form?.apartment ?? ''}
					/>
				</div>
				<Button type="submit" class="w-full">Skicka</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Kom du på ditt lösenord?
				<a href={route('/auth/sign-in')} class="underline">Logga in</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
