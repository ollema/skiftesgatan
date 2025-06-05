<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Skapa konto</Card.Title>
			<Card.Description>Ange dina uppgifter för att skapa ditt konto</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="apartment">Lägenhet</Label>
					<Input
						id="apartment"
						name="apartment"
						type="text"
						placeholder="Ange din lägenhet i formatet A1001"
						required
						minlength={4}
						maxlength={31}
						value={form?.apartment ?? ''}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="m@example.com"
						autocomplete="username"
						required
						value={form?.email ?? ''}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Lösenord</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
					/>
					<p class="text-muted-foreground text-sm">Lösenordet måste vara minst 8 tecken långt</p>
				</div>
				<Button type="submit" class="w-full">Skapa konto</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Har du redan ett konto?
				<a href="/auth/sign-in" class="underline">Logga in</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
