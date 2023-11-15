<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { HamburgerMenu } from 'radix-icons-svelte';
	import MobileLink from './mobile-link.svelte';
	import { siteConfig, navigation } from '$lib/config';
	import { afterNavigate } from '$app/navigation';
	import type { User } from '$lib/types';

	export let user: User | undefined;

	let open = false;

	afterNavigate(() => {
		open = false;
	});
</script>

<div class="flex w-full items-center justify-end md:hidden">
	<Sheet.Root bind:open>
		<Sheet.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				class="px-0 text-banner-foreground hover:bg-transparent hover:text-banner-foreground/80"
			>
				<HamburgerMenu class="h-5 w-5" />
			</Button>
		</Sheet.Trigger>

		<Sheet.Content side="left" class="bg-banner p-4 text-banner-foreground">
			<div class="flex h-full flex-col justify-between">
				<div>
					<a class="text-xl font-bold text-banner-foreground hover:underline" href="/">
						{siteConfig.name}
					</a>

					<div class="flex flex-col gap-2 pt-4">
						{#each navigation as navItem}
							<div>
								<MobileLink class="text-lg" href={navItem.href} title={navItem.title} />
								{#if navItem.items.length > 0}
									<div class="flex flex-col gap-1 pb-2">
										{#each navItem.items as subNavItem}
											<MobileLink class="pl-2" href={subNavItem.href} title={subNavItem.title} />
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="text-lg font-semibold">
					{#if user}
						<a href="/profile" class="hover:underline">
							{user.name}
						</a>
					{:else}
						<a href="/auth/signin" class="hover:underline">Logga in</a>
					{/if}
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
