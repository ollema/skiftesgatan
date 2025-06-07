<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import { route } from '$lib/routes';
	import { preferencesFormSchema, type PreferencesFormSchema } from './schema';
	import SuperDebug, { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { preferencesForm: SuperValidated<Infer<PreferencesFormSchema>> } } =
		$props();

	const form = superForm(data.preferencesForm, {
		validators: zodClient(preferencesFormSchema)
	});

	const { form: formData, enhance } = form;

	const timingOptions = [
		{ value: '1_hour', label: '1 timme innan' },
		{ value: '1_day', label: '1 dag innan' },
		{ value: '1_week', label: '1 vecka innan' }
	];

	const selectedLaundryTiming = $derived(
		$formData.laundryNotificationTiming
			? timingOptions.find((option) => option.value === $formData.laundryNotificationTiming)?.label
			: 'Välj tid'
	);
</script>

<SuperDebug data={$formData} />

<form method="POST" action={route('preferences /settings')} use:enhance>
	<Form.Field
		{form}
		name="laundryNotificationsEnabled"
		class="mb-2 flex flex-row items-center gap-2"
	>
		<Form.Control>
			{#snippet children({ props })}
				<Checkbox {...props} bind:checked={$formData.laundryNotificationsEnabled} />
				<Form.Label>Aktivera notifieringar för tvättstuga.</Form.Label>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="laundryNotificationTiming">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="laundry_timing">Meddela mig</Form.Label>
				<Select.Root
					type="single"
					bind:value={$formData.laundryNotificationTiming}
					name={props.name}
				>
					<Select.Trigger {...props}>
						{selectedLaundryTiming}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="1_hour" label="1 timme innan" />
						<Select.Item value="1_day" label="1 dag innan" />
						<Select.Item value="1_week" label="1 vecka innan" />
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="bbqNotificationsEnabled" class="mb-2 flex flex-row items-center gap-2">
		<Form.Control>
			{#snippet children({ props })}
				<Checkbox {...props} bind:checked={$formData.bbqNotificationsEnabled} />
				<Form.Label>Aktivera notifieringar för grillbokningar.</Form.Label>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="bbqNotificationTiming">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="bbq_timing">Meddela mig</Form.Label>
				<Select.Root type="single" bind:value={$formData.bbqNotificationTiming} name={props.name}>
					<Select.Trigger {...props}>
						{$formData.bbqNotificationTiming ? $formData.bbqNotificationTiming : 'Välj tid'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="1_hour" label="1 timme innan" />
						<Select.Item value="1_day" label="1 dag innan" />
						<Select.Item value="1_week" label="1 vecka innan" />
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Spara inställningar</Form.Button>
</form>
