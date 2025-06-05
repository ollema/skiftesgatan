<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="mt-8 flex w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Logga in</Card.Title>
			<Card.Description>Ange din email och lösenord för att logga in</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" required />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password">Lösenord</Label>
						<a href="/auth/forgot-password" class="ml-auto inline-block text-sm underline">
							Glömt ditt lösenord?
						</a>
					</div>
					<Input id="password" type="password" required />
				</div>
				<Button type="submit" class="w-full">Logga in</Button>
			</div>
			<div class="mt-4 text-center text-sm">
				Har du inte ett konto?
				<a href="/auth/sign-up" class="underline">Registrera dig</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
