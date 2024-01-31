<script lang="ts">
	import MainItem from './main-item.svelte';
	import { navigation } from '$lib/config';

	import { page } from '$app/stores';
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
		{#if $page.data.user}
			{#if $page.data.apartment}
				<a href="/apartments/{$page.data.apartment.apartment}" class="hover:underline">
					{$page.data.apartment.apartment}
				</a>
			{:else}
				<a href="/" class="hover:underline">
					{$page.data.user}
				</a>
			{/if}
		{:else}
			<a href="/auth/signin">Logga in</a>
		{/if}
	</div>
</div>
