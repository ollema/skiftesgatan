<script lang="ts">
	import Logo from './logo.svelte';
	import { MainNav, MobileNav } from '$lib/components/navigation';
	import { siteConfig } from '$lib/config';
	import type { User } from '$lib/types';
	import type { ApartmentsResponse } from '$lib/pocketbase-types';

	export let user: User | undefined;
	export let apartment: ApartmentsResponse | undefined;
</script>

<header class="sticky top-0 z-40 w-full border-b-2 bg-banner">
	<div class="container flex h-14 items-center">
		<a
			class="mr-6 flex flex-shrink-0 items-center gap-1 text-2xl font-bold text-banner-foreground hover:underline"
			href="/"
		>
			<div>Skiftesgatan</div>
			<Logo />
		</a>
		<MainNav {user} {apartment} />
		<MobileNav {user} {apartment} />
	</div>
</header>
