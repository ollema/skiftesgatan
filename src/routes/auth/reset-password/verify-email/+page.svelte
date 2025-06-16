<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { email: string; form: SuperValidated<Infer<FormSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Verifiera email</title>
</svelte:head>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Verifiera din emailadress</Card.Title>
			<Card.Description>Vi skickade en 8-siffrig kod till {data.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action={route('default /auth/reset-password/verify-email')}
				class="grid gap-4"
				use:enhance
			>
				<Form.Field {form} name="code" class="grid gap-2">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Kod</Form.Label>
							<Input
								{...props}
								type="text"
								placeholder="Ange 8-siffrig kod"
								maxlength={8}
								bind:value={$formData.code}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Ange den 8-siffriga koden från din email</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class="w-full">Verifiera</Form.Button>
			</form>
			<div class="mt-4 text-center text-sm">
				Fick du inte koden?
				<a href={route('/auth/forgot-password')} class="underline">Skicka igen</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
