<script lang="ts">
	import { MainNav, MobileNav } from '$lib/components/navigation';
	import { siteConfig } from '$lib/config';
	import type { User } from '$lib/types';

	export let user: User | undefined;
</script>

<header class="sticky top-0 z-40 w-full border-b-2 bg-banner">
	<div class="container flex h-14 items-center">
		<a
			class="mr-6 flex-shrink-0 text-2xl font-bold text-banner-foreground hover:underline min-[350px]:block"
			href="/"
		>
			{siteConfig.name}
		</a>
		<MainNav {user} />
		<MobileNav {user} />
	</div>
</header>
