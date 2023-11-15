<script lang="ts">
	import { MainNav, MobileNav } from '$lib/components/navigation';
	import type { User } from '$lib/types';

	export let user: User | undefined;
</script>

<header
	class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 items-center">
		<MainNav />
		<MobileNav />
		<div class="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
			<div class="w-full flex-1 md:w-auto md:flex-none">
				<!-- command menu here? -->
			</div>
			<div class="flex items-center gap-3">
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
