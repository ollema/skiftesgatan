<script lang="ts">
	import Logo from './logo.svelte';
	import MobileNav from './mobile-nav.svelte';
	import MainNav from './main-nav.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { route } from '$lib/routes';
</script>

<header class="bg-background sticky top-0 z-50 w-full">
	<div class="container">
		<div class="flex h-(--header-height) items-center gap-2 **:data-[slot=separator]:!h-4">
			<MobileNav class="flex lg:hidden" />
			<Button href="/" variant="ghost" size="icon" class="hidden size-8 lg:flex">
				<Logo />
			</Button>
			<MainNav class="hidden lg:flex" />
			<div class="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
				{#if page.data.user === null}
					<a
						href={route('/auth/sign-in')}
						class={cn('justify-self-end', buttonVariants({ variant: 'ghost' }), 'text-base')}
					>
						Logga in
					</a>
				{:else}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class={cn('justify-self-end', buttonVariants({ variant: 'ghost' }), 'text-base')}
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
