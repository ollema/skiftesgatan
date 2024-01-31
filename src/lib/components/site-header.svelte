<script lang="ts">
	import Logo from './logo.svelte';
	import { MainNav, MobileNav } from '$lib/components/navigation';
</script>

<header class="sticky top-0 z-40 w-full border-b-2 bg-banner">
	<div class="container flex h-14 items-center">
		<a
			class="mr-6 flex flex-shrink-0 items-center text-2xl font-black text-banner-foreground hover:underline"
			href="/"
		>
			<div>Skiftesgatan</div>
			<Logo />
		</a>
		<MainNav />
		<MobileNav />
	</div>
</header>
