<script lang="ts">
	import MainLink from './main-link.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from 'radix-icons-svelte';
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
				<MainLink {navItem} />
				{#if navItem.items.length > 0}
					<Popover.Root positioning={{ placement: 'bottom' }}>
						<Popover.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="ghost"
								class="m-0 h-7 p-0 text-banner-foreground/60 hover:bg-banner hover:text-banner-foreground"
							>
								<ChevronDown class="h-4 w-4" />
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-fit bg-banner text-banner-foreground">
							<ol class="flex list-none flex-col gap-1 bg-banner">
								{#each navItem.items as subNavItem}
									<MainLink navItem={subNavItem} class="text-base" />
								{/each}
							</ol>
						</Popover.Content>
					</Popover.Root>
				{/if}
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
