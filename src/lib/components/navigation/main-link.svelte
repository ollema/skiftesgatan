<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import type { NavItem } from '$lib/config';

	export let navItem: NavItem;
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<li>
	<a
		class={cn(
			'text-lg font-semibold hover:text-banner-foreground hover:underline',
			$page.url.pathname.startsWith(navItem.href)
				? 'text-banner-foreground'
				: 'text-banner-foreground/60',
			className
		)}
		href={navItem.href}
	>
		{navItem.title}
	</a>
</li>
