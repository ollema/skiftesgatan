<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { data, form } = $props();
</script>

<div class="container mx-auto max-w-2xl space-y-6 p-4">
	<h1 class="text-3xl font-bold">Inställningar</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera e-post</Card.Title>
			<Card.Description>Din nuvarande e-post: {data.user.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance action="?/email" class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Ny e-post</Label>
					<Input id="email" name="email" type="email" placeholder="ny@example.com" required />
				</div>
				<Button type="submit" class="w-full">Uppdatera e-post</Button>
				{#if form?.email?.message}
					<p class="text-destructive text-center text-sm">{form.email.message}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera lösenord</Card.Title>
			<Card.Description>Ändra ditt nuvarande lösenord</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance action="?/password" class="grid gap-4">
				<div class="grid gap-2">
					<Label for="password">Nuvarande lösenord</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="new_password">Nytt lösenord</Label>
					<Input
						id="new_password"
						name="new_password"
						type="password"
						autocomplete="new-password"
						required
					/>
					<p class="text-muted-foreground text-sm">Lösenordet måste vara minst 8 tecken långt</p>
				</div>
				<Button type="submit" class="w-full">Uppdatera lösenord</Button>
				{#if form?.password?.message}
					<p class="text-destructive text-center text-sm">{form.password.message}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
