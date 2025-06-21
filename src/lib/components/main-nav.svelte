<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
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
							<a
								href={group.href}
								class={[
									'justify-self-end',
									'h-9 px-4 py-2',
									'focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px]',
									'hover:bg-primary/40 hover:text-primary-foreground',
									'!text-base'
								]}
							>
								{group.title}
							</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{:else}
				<NavigationMenu.Item>
					<NavigationMenu.Trigger
						class={[
							'bg-foreground hover:bg-primary/40 hover:text-primary-foreground focus:bg-primary/40 focus:text-primary-foreground data-[state=open]:hover:bg-primary/40 data-[state=open]:text-primary-foreground data-[state=open]:focus:bg-primary/40 data-[state=open]:bg-primary/40 focus-visible:ring-ring/50 group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-base font-medium transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50',
							'text-base'
						]}
					>
						{group.title}
					</NavigationMenu.Trigger>
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
