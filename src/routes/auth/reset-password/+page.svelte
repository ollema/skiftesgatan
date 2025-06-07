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

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Ange nytt lösenord</Card.Title>
			<Card.Description>Skapa ett nytt lösenord för ditt konto</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action={route('default /auth/reset-password')}
				class="grid gap-4"
				use:enhance
			>
				<Form.Field {form} name="password" class="grid gap-2">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Lösenord</Form.Label>
							<Input
								{...props}
								type="password"
								autocomplete="new-password"
								bind:value={$formData.password}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Lösenordet måste vara minst 8 tecken långt</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class="w-full">Återställ lösenord</Form.Button>
			</form>
			<div class="mt-4 text-center text-sm">
				Kom du på ditt lösenord?
				<a href={route('/auth/sign-in')} class="underline">Logga in</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
