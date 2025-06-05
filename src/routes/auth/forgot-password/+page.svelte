<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();
</script>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Glömt ditt lösenord?</Card.Title>
			<Card.Description>Ange din email för att återställa ditt lösenord</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="m@example.com"
						required
						value={form?.email ?? ''}
					/>
				</div>
				<Button type="submit" class="w-full">Skicka</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Kom du på ditt lösenord?
				<a href="/auth/sign-in" class="underline">Logga in</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
