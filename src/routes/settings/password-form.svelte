<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { passwordFormSchema, type PasswordFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { page } from '$app/state';

	let { passwordForm }: { passwordForm: SuperValidated<Infer<PasswordFormSchema>> } = $props();

	const form = superForm(passwordForm, {
		validators: zodClient(passwordFormSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action={route('password /settings')} use:enhance>
	<!-- hidden username field for accessibility and password managers -->
	<input
		type="text"
		id="username"
		name="username"
		value={page.data.user?.apartment}
		autocomplete="username"
		readonly
		tabindex="-1"
		style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
	/>

	<Form.Field {form} name="currentPassword" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="currentPassword">Nuvarande lösenord</Form.Label>
				<Input
					{...props}
					type="password"
					autocomplete="current-password"
					bind:value={$formData.currentPassword}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="newPassword" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="newPassword">Nytt lösenord</Form.Label>
				<Input
					{...props}
					type="password"
					autocomplete="new-password"
					bind:value={$formData.newPassword}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Uppdatera lösenord</Form.Button>
</form>
