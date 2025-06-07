<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PreferencesForm from './preferences-form.svelte';
	import EmailForm from './email-form.svelte';
	import PasswordForm from './password-form.svelte';

	let { data } = $props();
</script>

<div class="container mx-auto max-w-2xl space-y-6 p-4">
	<h1 class="text-3xl font-bold">Inställningar</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Notifieringsinställningar</Card.Title>
			<Card.Description>
				Konfigurera när du vill bli notifierad innan dina bokningar börjar
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<PreferencesForm {data} />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera email</Card.Title>
			<Card.Description>Din nuvarande email: {data.user.email}</Card.Description>
		</Card.Header>
		<Card.Content>
			<EmailForm emailForm={data.emailForm} />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">Uppdatera lösenord</Card.Title>
			<Card.Description>Ändra ditt nuvarande lösenord</Card.Description>
		</Card.Header>
		<Card.Content>
			<PasswordForm passwordForm={data.passwordForm} />
		</Card.Content>
	</Card.Root>
</div>
