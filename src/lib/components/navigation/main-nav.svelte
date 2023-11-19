<script lang="ts">
	import MainItem from './main-item.svelte';
	import { navigation } from '$lib/config';
	import type { Apartment, User } from '$lib/types';

	export let user: User | undefined;
	export let apartment: Apartment | undefined;

	$: apartmentHref = apartment ? `/apartments/${apartment.apartment}` : '/';
</script>

<div class="hidden w-full items-center justify-between text-banner-foreground md:flex">
	<nav class="flex items-center gap-4">
		{#each navigation as navItem}
			<ol class="flex list-none items-center gap-1">
				<MainItem {navItem} />
			</ol>
		{/each}
	</nav>

	<div class="text-lg font-semibold hover:underline">
		{#if user}
			<a href={apartmentHref} class="hover:underline">
				{apartment?.apartment || user.name}
			</a>
		{:else}
			<a href="/auth/signin">Logga in</a>
		{/if}
	</div>
</div>
