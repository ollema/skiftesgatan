<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import { route } from '$lib/routes';

	let { data, form } = $props();

	let laundryEnabled = $derived(data.preferences?.laundryNotificationsEnabled ?? true);
	let laundryTiming = $derived(data.preferences?.laundryNotificationTiming ?? '1_hour');
	let bbqEnabled = $derived(data.preferences?.bbqNotificationsEnabled ?? true);
	let bbqTiming = $derived(data.preferences?.bbqNotificationTiming ?? '1_week');

	const timingOptions = [
		{ value: '1_hour', label: '1 timme innan' },
		{ value: '1_day', label: '1 dag innan' },
		{ value: '1_week', label: '1 vecka innan' }
	];

	const laundryTimingLabel = $derived(
		timingOptions.find((t) => t.value === laundryTiming)?.label ?? 'Välj tid'
	);

	const bbqTimingLabel = $derived(
		timingOptions.find((t) => t.value === bbqTiming)?.label ?? 'Välj tid'
	);

	let email = $derived(data.user.email);
</script>

<div class="container mx-auto max-w-2xl space-y-6 p-4">
	<h1 class="text-3xl font-bold">Inställningar</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Notifieringsinställningar</Card.Title>
			<Card.Description
				>Konfigurera när du vill bli notifierad innan dina bokningar börjar</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form method="post" action={route('preferences /settings')} class="grid gap-6" use:enhance>
				<div class="space-y-4">
					<h3 class="text-lg font-medium">Tvättstugebokningar</h3>
					<div class="flex items-center space-x-2">
						<Checkbox
							id="laundry_enabled"
							name="laundry_enabled"
							bind:checked={laundryEnabled}
							aria-labelledby="laundry_enabled_label"
						/>
						<Label
							id="laundry_enabled_label"
							for="laundry_enabled"
							class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Aktivera notifieringar för tvättstuga
						</Label>
					</div>
					<div class="grid gap-2">
						<Label for="laundry_timing">Meddela mig</Label>
						<Select.Root name="laundry_timing" type="single" bind:value={laundryTiming}>
							<Select.Trigger class="w-full">
								{laundryTimingLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Välj tid</Select.Label>
									{#each timingOptions as option (option.value)}
										<Select.Item value={option.value} label={option.label}>
											{option.label}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="text-lg font-medium">Grillbokningar</h3>
					<div class="flex items-center space-x-2">
						<Checkbox
							id="bbq_enabled"
							name="bbq_enabled"
							bind:checked={bbqEnabled}
							aria-labelledby="bbq_enabled_label"
						/>
						<Label
							id="bbq_enabled_label"
							for="bbq_enabled"
							class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Aktivera notifieringar för grill
						</Label>
					</div>
					<div class="grid gap-2">
						<Label for="bbq_timing">Meddela mig</Label>
						<Select.Root name="bbq_timing" type="single" bind:value={bbqTiming}>
							<Select.Trigger class="w-full">
								{bbqTimingLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Välj tid</Select.Label>
									{#each timingOptions as option (option.value)}
										<Select.Item value={option.value} label={option.label}>
											{option.label}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<Button type="submit" class="w-full">Spara inställningar</Button>
				{#if form?.preferences?.message}
					<p
						class="text-center text-sm"
						class:text-destructive={form.preferences.message !== 'Inställningar uppdaterade'}
						class:text-green-600={form.preferences.message === 'Inställningar uppdaterade'}
					>
						{form.preferences.message}
					</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera e-post</Card.Title>
			<Card.Description>Din nuvarande e-post: {email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action={route('email /settings')} class="grid gap-4" use:enhance>
				<div class="grid gap-2">
					<Label for="email">Ny e-post</Label>
					<Input id="email" name="email" type="email" placeholder="namn@email.se" required />
				</div>
				<Button type="submit" class="w-full">Uppdatera e-post</Button>
				{#if form?.email?.message}
					<p class="text-destructive text-center text-sm">{form.email.message}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera lösenord</Card.Title>
			<Card.Description>Ändra ditt nuvarande lösenord</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action={route('password /settings')} class="grid gap-4" use:enhance>
				<div class="grid gap-2">
					<Label for="password">Nuvarande lösenord</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="new_password">Nytt lösenord</Label>
					<Input
						id="new_password"
						name="new_password"
						type="password"
						autocomplete="new-password"
						required
					/>
					<p class="text-muted-foreground text-sm">Lösenordet måste vara minst 8 tecken långt</p>
				</div>
				<Button type="submit" class="w-full">Uppdatera lösenord</Button>
				{#if form?.password?.message}
					<p class="text-destructive text-center text-sm">{form.password.message}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
