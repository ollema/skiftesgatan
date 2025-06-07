<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { passwordFormSchema, type PasswordFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { passwordForm }: { passwordForm: SuperValidated<Infer<PasswordFormSchema>> } = $props();

	const form = superForm(passwordForm, {
		validators: zodClient(passwordFormSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action={route('password /settings')} use:enhance>
	<Form.Field {form} name="currentPassword" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="currentPassword">Nuvarande lösenord</Form.Label>
				<Input
					{...props}
					type="password"
					bind:value={$formData.currentPassword}
					autocomplete="current-password"
					required
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="newPassword" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="newPassword">Nytt lösenord</Form.Label>
				<Input {...props} bind:value={$formData.newPassword} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Uppdatera lösenord</Form.Button>
</form>
