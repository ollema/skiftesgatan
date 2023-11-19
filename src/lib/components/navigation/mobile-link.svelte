<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import type { NavItem } from '$lib/config';

	export let navItem: NavItem;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<a
	href={navItem.href}
	class={cn(
		'font-semibold transition-colors hover:text-banner-foreground hover:underline',
		$page.url.pathname.startsWith(navItem.href)
			? 'text-banner-foreground'
			: 'text-banner-foreground/60',
		className
	)}
>
	{navItem.title}
</a>
