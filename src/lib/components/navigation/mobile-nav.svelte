<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { HamburgerMenu } from 'radix-icons-svelte';
	import MobileLink from './mobile-link.svelte';
	import { siteConfig, navigation } from '$lib/config';
	import { afterNavigate } from '$app/navigation';

	let open = false;

	afterNavigate(() => {
		open = false;
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			class="mr-4 px-0 text-banner-foreground hover:bg-transparent hover:text-banner-foreground/80 md:hidden"
		>
			<HamburgerMenu class="h-5 w-5" />
		</Button>

		<a
			class="mr-4 hidden text-2xl font-bold text-banner-foreground hover:underline min-[350px]:block md:hidden"
			href="/"
		>
			{siteConfig.name}
		</a>
	</Sheet.Trigger>

	<Sheet.Content side="left" class="bg-banner p-3 pl-4 text-banner-foreground">
		<a class="mr-4 text-xl font-bold text-banner-foreground hover:underline" href="/">
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
	</Sheet.Content>
</Sheet.Root>
