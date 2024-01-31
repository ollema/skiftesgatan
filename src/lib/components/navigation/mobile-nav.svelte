<script lang="ts">
	import MobileItem from './mobile-item.svelte';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { HamburgerMenu } from 'radix-icons-svelte';
	import { siteConfig, navigation } from '$lib/config';
	import { afterNavigate } from '$app/navigation';

	import { page } from '$app/stores';

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

					<ol class="list-non flex flex-col gap-2 pt-4">
						{#each navigation as navItem}
							<div>
								<MobileItem {navItem} />
							</div>
						{/each}
					</ol>
				</div>

				<div class="text-lg font-semibold">
					{#if $page.data.user}
						{#if $page.data.apartment}
							<a href="/apartments/{$page.data.apartment.apartment}" class="hover:underline">
								{$page.data.apartment.apartment}
							</a>
						{:else}
							<a href="/" class="hover:underline">
								{$page.data.user.name}
							</a>
						{/if}
					{:else}
						<a href="/auth/signin" class="hover:underline">Logga in</a>
					{/if}
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
