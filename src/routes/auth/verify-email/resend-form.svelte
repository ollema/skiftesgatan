<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { route } from '$lib/routes';
	import { resendFormSchema, type ResendFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { resendForm }: { resendForm: SuperValidated<Infer<ResendFormSchema>> } = $props();

	const form = superForm(resendForm, {
		validators: zodClient(resendFormSchema),
		resetForm: false
	});

	const { enhance } = form;
</script>

<form method="post" action={route('resend /auth/verify-email')} class="grid gap-4" use:enhance>
	<Form.Button variant="outline" class="w-full">Skicka kod igen</Form.Button>
</form>
