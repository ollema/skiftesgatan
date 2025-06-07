<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { route } from '$lib/routes';
	import { verifyFormSchema, type VerifyFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { verifyForm }: { verifyForm: SuperValidated<Infer<VerifyFormSchema>> } = $props();

	const form = superForm(verifyForm, {
		validators: zodClient(verifyFormSchema),
		resetForm: false
	});

	const { form: formData, enhance } = form;
</script>

<form method="post" action={route('verify /auth/verify-email')} class="grid gap-4" use:enhance>
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
