<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { emailFormSchema, type EmailFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { emailForm }: { emailForm: SuperValidated<Infer<EmailFormSchema>> } = $props();

	const form = superForm(emailForm, {
		validators: zodClient(emailFormSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action={route('email /settings')} use:enhance>
	<Form.Field {form} name="email" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="email">Ny emailadress</Form.Label>
				<Input {...props} bind:value={$formData.email} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Uppdatera email</Form.Button>
</form>
