<script lang="ts">
	import Logo from './logo.svelte';
	import MobileNav from './mobile-nav.svelte';
	import MainNav from './main-nav.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { route } from '$lib/routes';
</script>

<header class="bg-foreground sticky top-0 z-50 w-full text-white">
	<div class="container">
		<div class="flex h-(--header-height) items-center gap-2 **:data-[slot=separator]:!h-4">
			<MobileNav class="flex lg:hidden" />
			<a
				href="/"
				class={cn(
					'justify-self-end',
					'h-9 px-4 py-2',
					'focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px]',
					'hover:bg-primary/40 hover:text-primary-foreground',
					'text-base'
				)}
			>
				<div class="text-lg font-extrabold">Skiftesgatan</div>
				<div class="mr-[-0.33rem] mb-[0.4rem] ml-[-0.5rem] flex size-5"><Logo /></div>
			</a>
			<MainNav class="hidden lg:flex" />
			<div class="ml-auto hidden items-center gap-2 lg:flex lg:flex-1 lg:justify-end">
				{#if page.data.user === null}
					<a
						href={route('/auth/sign-in')}
						class={cn(
							'justify-self-end',
							'h-9 px-4 py-2',
							'focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px]',
							'hover:bg-primary/40 hover:text-primary-foreground',
							'text-base'
						)}
					>
						Logga in
					</a>
				{:else}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class={cn(
								'justify-self-end',
								'h-9 px-4 py-2',
								'focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px]',
								'hover:bg-primary/40 hover:text-primary-foreground',
								'text-base'
							)}
						>
							{page.data.user.apartment}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Item>
								<a href={route('/settings')}>Inställningar</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<form method="post" action={route('default /auth/sign-out')} use:enhance>
									<button type="submit" class="w-full text-left">Logga ut</button>
								</form>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</div>
		</div>
	</div>
</header>
