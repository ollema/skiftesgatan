<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { data, form } = $props();
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Verifiera din e-postadress</Card.Title>
			<Card.Description>Vi skickade en 8-siffrig kod till {data.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="code">Kod</Label>
					<Input
						id="code"
						name="code"
						type="text"
						placeholder="Ange 8-siffrig kod"
						required
						maxlength={8}
						minlength={8}
					/>
					<p class="text-muted-foreground text-sm">Ange den 8-siffriga koden från din e-post</p>
				</div>
				<Button type="submit" class="w-full">Verifiera</Button>
				{#if form?.message}
					<p class="text-destructive text-center text-sm">{form.message}</p>
				{/if}
			</form>
			<div class="mt-4 text-center text-sm">
				Fick du inte koden?
				<a href="/auth/forgot-password" class="underline">Skicka igen</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
