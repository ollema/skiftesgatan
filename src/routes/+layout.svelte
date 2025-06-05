<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/merriweather';
	import '../app.css';

	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Logo from '$lib/components/logo.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import { navigation } from '$lib/config/navigation';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	const isMobile = new IsMobile();

	let { data, children } = $props();

	type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
		title: string;
		href: string;
		content: string;
	};
</script>

{#snippet ListItem({ title, content, href, class: className, ...restProps }: ListItemProps)}
	<li>
		<NavigationMenu.Link>
			{#snippet child()}
				<a
					{href}
					class={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none',
						className
					)}
					{...restProps}
				>
					<div class="text-sm leading-none font-medium">{title}</div>
					<p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
						{content}
					</p>
				</a>
			{/snippet}
		</NavigationMenu.Link>
	</li>
{/snippet}

<Sidebar.Provider open={false}>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="bg-sidebar text-sidebar-foreground sticky top-0 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-4"
		>
			<a class="mr-6 flex flex-shrink-0 items-center text-2xl font-bold" href="/">
				<div>Skiftesgatan</div>
				<Logo />
			</a>
			{#if !isMobile.current}
				<NavigationMenu.Root class="justify-self-center">
					<NavigationMenu.List>
						{#each navigation as item (item.title)}
							{#if item.items !== undefined}
								<NavigationMenu.Item>
									<NavigationMenu.Trigger
										class="bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-[state=open]:focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent/50"
									>
										{item.title}
									</NavigationMenu.Trigger>
									<NavigationMenu.Content>
										<ul class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
											{#each item.items as subItem (subItem.title)}
												{@render ListItem({
													href: subItem.href,
													title: subItem.title,
													content: subItem.content ?? ''
												})}
											{/each}
										</ul>
									</NavigationMenu.Content>
								</NavigationMenu.Item>
							{:else}
								<NavigationMenu.Item>
									<NavigationMenu.Link
										href={item.href}
										class={cn(
											navigationMenuTriggerStyle(),
											'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar focus:text-sidebar-accent-foreground hover:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-[state=open]:focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent/50'
										)}
									>
										{item.title}
									</NavigationMenu.Link>
								</NavigationMenu.Item>
							{/if}
						{/each}
					</NavigationMenu.List>
				</NavigationMenu.Root>
				{#if data.user === null}
					<a href="/auth/sign-in" class="justify-self-end">Logga in</a>
				{:else}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class={cn(
								'justify-self-end',
								buttonVariants({ variant: 'ghost' }),
								'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-[state=open]:focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent/50'
							)}
						>
							{data.user.apartment}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Item>
								<a href="/settings">Inställningar</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<form method="post" action="/auth/sign-out/">
									<button type="submit" class="w-full text-left">Logga ut</button>
								</form>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			{:else}
				<div class="justify-self-center"></div>
				<Sidebar.Trigger class="justify-self-end" />
			{/if}
		</header>
		<main>
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
