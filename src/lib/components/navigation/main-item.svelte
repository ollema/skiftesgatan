<script lang="ts">
	import MainLink from './main-link.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import ChevronDown from 'svelte-radix/ChevronDown.svelte';
	import type { NavItem } from '$lib/config';
	import { afterNavigate } from '$app/navigation';

	export let navItem: NavItem;

	let open = false;

	afterNavigate(() => {
		open = false;
	});
</script>

<MainLink {navItem} />
{#if navItem.items.length > 0}
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				class="m-0 h-7 p-0 text-banner-foreground/60 hover:bg-banner hover:text-banner-foreground"
			>
				<ChevronDown class="h-4 w-4" />
			</Button>
		</Popover.Trigger>
		<Popover.Content side={'bottom'} class="w-fit bg-banner text-banner-foreground">
			<ol class="flex list-none flex-col gap-1 bg-banner">
				{#each navItem.items as subNavItem}
					<MainLink navItem={subNavItem} class="text-base" />
				{/each}
			</ol>
		</Popover.Content>
	</Popover.Root>
{/if}
