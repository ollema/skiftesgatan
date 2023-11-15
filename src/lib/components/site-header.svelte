<script lang="ts">
	import { MainNav, MobileNav } from '$lib/components/navigation';
	import type { User } from '$lib/types';

	export let user: User | undefined;
</script>

<header class="sticky top-0 z-40 w-full border-b-2 bg-foreground">
	<div class="container flex h-14 items-center">
		<MainNav />
		<MobileNav />
		<div class="flex flex-1 items-center justify-end">
			<div class="flex items-center gap-3 text-lg font-semibold text-white">
				{#if user}
					<a href="/profile" class="hover:underline">
						{user.name}
					</a>
				{:else}
					<a href="/auth/signin" class="hover:underline">Logga in</a>
				{/if}
			</div>
		</div>
	</div>
</header>
