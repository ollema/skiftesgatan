<script lang="ts">
	import MobileLink from './mobile-link.svelte';
	import type { NavItem } from '$lib/config/navigation';

	export let navItem: NavItem;
</script>

<MobileLink class="text-lg" {navItem} />
{#if navItem.items.length > 0}
	<ol class="flex list-none flex-col gap-1 pb-2">
		{#each navItem.items as subNavItem}
			<MobileLink class="pl-2" navItem={subNavItem} />
		{/each}
	</ol>
{/if}
