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
			<Card.Title class="text-2xl">Ange nytt lösenord</Card.Title>
			<Card.Description>Skapa ett nytt lösenord för ditt konto</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance class="grid gap-4">
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
				<Button type="submit" class="w-full">Återställ lösenord</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Kom du på ditt lösenord?
				<a href="/auth/login" class="underline">Logga in</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
