<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { mainNavItems } from '$lib/navigation.js';

	let {
		class: className
	}: {
		class?: string;
	} & HTMLAttributes<HTMLElement> = $props();

	type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
		title: string;
		href: string;
		description?: string;
	};
</script>

{#snippet ListItem({ title, href, description }: ListItemProps)}
	<li>
		<NavigationMenu.Link>
			{#snippet child()}
				<a
					{href}
					class={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none'
					)}
				>
					<div class="text-sm leading-none font-medium">{title}</div>
					<p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
						{description}
					</p>
				</a>
			{/snippet}
		</NavigationMenu.Link>
	</li>
{/snippet}

<NavigationMenu.Root class={className}>
	<NavigationMenu.List>
		{#each mainNavItems as group (group.title)}
			{#if !group.items || group.items.length === 0}
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={group.href} class={[navigationMenuTriggerStyle(), '!text-base']}
								>{group.title}</a
							>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{:else}
				<NavigationMenu.Item>
					<NavigationMenu.Trigger class="text-base">{group.title}</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<ul class="grid w-[400px] gap-2 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
							{#each group.items as item (item.title)}
								{@render ListItem({
									title: item.title,
									href: item.href!,
									description: item.description
								})}
							{/each}
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			{/if}
		{/each}
	</NavigationMenu.List>
</NavigationMenu.Root>
