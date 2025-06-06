<script lang="ts">
	import { enhance } from '$app/forms';
	import { route } from '$lib/routes';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	// Get today's date in YYYY-MM-DD format
	const today = new Date().toISOString().split('T')[0];
</script>

<svelte:head>
	<title>Boka BBQ/uteplats</title>
</svelte:head>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold">Boka BBQ/uteplats</h1>

	<!-- Current bookings -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold">
			Aktuella bokningar ({data.currentMonth}/{data.currentYear})
		</h2>
		{#if data.bookings.length > 0}
			<div class="space-y-2">
				{#each data.bookings as booking (booking.id)}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div>
							<p class="font-medium">
								{new Date(booking.startTime).toLocaleDateString('sv-SE')}
								{new Date(booking.startTime).toLocaleTimeString('sv-SE', {
									hour: '2-digit',
									minute: '2-digit'
								})}
								-
								{new Date(booking.endTime).toLocaleTimeString('sv-SE', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</p>
							<p class="text-sm text-gray-600">Lägenhet: {booking.apartment}</p>
						</div>
						{#if booking.userId === data.user.id}
							<form method="POST" action={route('cancel /booking/bbq')} use:enhance>
								<input type="hidden" name="bookingId" value={booking.id} />
								<button
									type="submit"
									class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
								>
									Avboka
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-600">Inga bokningar för denna månad.</p>
		{/if}
	</div>

	<!-- Create new booking -->
	<div class="rounded-lg bg-gray-50 p-6">
		<h2 class="mb-4 text-xl font-semibold">Skapa ny bokning</h2>

		<form method="POST" action={route('create /booking/bbq')} use:enhance class="space-y-4">
			<div>
				<label for="date" class="mb-1 block text-sm font-medium text-gray-700">Datum</label>
				<input
					type="date"
					id="date"
					name="date"
					min={today}
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
				<p class="mt-1 text-sm text-gray-600">
					BBQ/uteplats är tillgänglig {data.bbqSlot.label} varje dag
				</p>
			</div>

			<button
				type="submit"
				class="rounded-md bg-green-500 px-6 py-2 font-medium text-white hover:bg-green-600"
			>
				Boka BBQ/uteplats
			</button>
		</form>

		<!-- Form messages -->
		{#if form?.create?.message}
			<div class="mt-4 rounded-md p-3">
				{form.create.message}
			</div>
		{/if}

		{#if form?.cancel?.message}
			<div class="mt-4 rounded-md bg-green-100 p-3 text-green-800">
				{form.cancel.message}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Add any custom styles here if needed */
</style>
