<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { siteConfig } from '$lib/config/site';
	import { navigation } from '$lib/config';
</script>

<nav class="hidden items-center gap-4 md:flex">
	<a class="mr-4 text-2xl font-bold text-banner-foreground hover:underline" href="/">
		{siteConfig.name}
	</a>
	{#each navigation as navItem}
		<a
			class={cn(
				'text-lg font-semibold transition-colors hover:text-banner-foreground hover:underline',
				$page.url.pathname.startsWith(navItem.href)
					? 'text-banner-foreground'
					: 'text-banner-foreground/60'
			)}
			href={navItem.href}
		>
			{navItem.title}
		</a>
	{/each}
</nav>
