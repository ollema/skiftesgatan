<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form } = $props();
</script>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Verifiera din e-postadress</Card.Title>
			<Card.Description>Vi skickade en 8-siffrig kod till {data.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance action="?/verify" class="grid gap-4">
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
				{#if form?.verify?.message}
					<p class="text-destructive text-center text-sm">{form.verify.message}</p>
				{/if}
			</form>

			<div class="mt-4">
				<form method="post" use:enhance action="?/resend">
					<Button type="submit" variant="outline" class="w-full">Skicka kod igen</Button>
					{#if form?.resend?.message}
						<p
							class="mt-2 text-center text-sm {form.resend.message.includes('skickad')
								? 'text-green-600'
								: 'text-destructive'}"
						>
							{form.resend.message}
						</p>
					{/if}
				</form>
			</div>
		</Card.Content>
	</Card.Root>
</div>
