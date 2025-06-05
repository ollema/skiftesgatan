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
			<Card.Title class="text-2xl">Logga in</Card.Title>
			<Card.Description>Ange ditt lägenhetsnummer och lösenord för att logga in</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action={route('default /auth/sign-in')} class="grid gap-4" use:enhance>
				<div class="grid gap-2">
					<Label for="apartment">Lägenhetsnummer</Label>
					<Input
						id="apartment"
						name="apartment"
						type="text"
						placeholder="A1001"
						autocomplete="username"
						required
						value={form?.apartment ?? ''}
					/>
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password">Lösenord</Label>
						<a href={route('/auth/forgot-password')} class="ml-auto inline-block text-sm underline">
							Glömt ditt lösenord?
						</a>
					</div>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
					/>
				</div>
				<Button type="submit" class="w-full">Logga in</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Har du inte ett konto?
				<a href={route('/auth/sign-up')} class="underline">Registrera dig</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
