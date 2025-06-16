<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Logga in</title>
</svelte:head>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Logga in</Card.Title>
			<Card.Description>Ange ditt lägenhetsnummer och lösenord för att logga in</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action={route('default /auth/sign-in')} class="grid gap-4" use:enhance>
				<Form.Field {form} name="apartment" class="grid gap-2">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Lägenhetsnummer</Form.Label>
							<Input
								{...props}
								type="text"
								placeholder="A1001"
								autocomplete="username"
								bind:value={$formData.apartment}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password" class="grid gap-2">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center">
								<Form.Label>Lösenord</Form.Label>
								<a
									href={route('/auth/forgot-password')}
									class="ml-auto inline-block text-sm underline"
								>
									Glömt ditt lösenord?
								</a>
							</div>
							<Input
								{...props}
								type="password"
								autocomplete="current-password"
								bind:value={$formData.password}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class="w-full">Logga in</Form.Button>
			</form>
			<div class="mt-4 text-center text-sm">
				Har du inte ett konto?
				<a href={route('/auth/sign-up')} class="underline">Registrera dig</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
