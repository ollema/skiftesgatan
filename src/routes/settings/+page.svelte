<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { route } from '$lib/routes';

	let { data, form } = $props();
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
						<input
							type="checkbox"
							id="laundry_enabled"
							name="laundry_enabled"
							class="h-4 w-4 rounded border-gray-300"
							checked={data.preferences?.laundryNotificationsEnabled ?? true}
						/>
						<Label for="laundry_enabled">Aktivera notifieringar för tvättstuga</Label>
					</div>
					<div class="grid gap-2">
						<Label for="laundry_timing">Meddela mig</Label>
						<select
							id="laundry_timing"
							name="laundry_timing"
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option
								value="1_hour"
								selected={data.preferences?.laundryNotificationTiming === '1_hour'}
								>1 timme innan</option
							>
							<option
								value="1_day"
								selected={data.preferences?.laundryNotificationTiming === '1_day'}
								>1 dag innan</option
							>
							<option
								value="1_week"
								selected={data.preferences?.laundryNotificationTiming === '1_week'}
								>1 vecka innan</option
							>
						</select>
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="text-lg font-medium">Grillbokningar</h3>
					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="bbq_enabled"
							name="bbq_enabled"
							class="h-4 w-4 rounded border-gray-300"
							checked={data.preferences?.bbqNotificationsEnabled ?? true}
						/>
						<Label for="bbq_enabled">Aktivera notifieringar för grill</Label>
					</div>
					<div class="grid gap-2">
						<Label for="bbq_timing">Meddela mig</Label>
						<select
							id="bbq_timing"
							name="bbq_timing"
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="1_hour" selected={data.preferences?.bbqNotificationTiming === '1_hour'}
								>1 timme innan</option
							>
							<option value="1_day" selected={data.preferences?.bbqNotificationTiming === '1_day'}
								>1 dag innan</option
							>
							<option value="1_week" selected={data.preferences?.bbqNotificationTiming === '1_week'}
								>1 vecka innan</option
							>
						</select>
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
			<Card.Description>Din nuvarande e-post: {data.user.email}</Card.Description>
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
