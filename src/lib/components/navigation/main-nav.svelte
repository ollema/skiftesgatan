<script lang="ts">
	import MainLink from './main-link.svelte';
	import { navigation } from '$lib/config';
	import type { Apartment, User } from '$lib/types';

	export let user: User | undefined;
	export let apartment: Apartment | undefined;

	$: apartmentHref = apartment ? `/apartments/${apartment.apartment}` : '/';
</script>

<div class="hidden w-full items-center justify-between text-banner-foreground md:flex">
	<nav class="flex items-center gap-4">
		{#each navigation as navItem}
			<MainLink {navItem} />
		{/each}
	</nav>

	<div class="text-lg font-semibold">
		{#if user}
			<a href={apartmentHref} class="hover:underline">
				{user.name} ({apartment?.apartment || '?'})
			</a>
		{:else}
			<a href="/auth/signin" class="hover:underline">Logga in</a>
		{/if}
	</div>
</div>
