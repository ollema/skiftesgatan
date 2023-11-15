<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	export let href: string;
	export let title: string;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<a
	{href}
	class={cn(
		'font-semibold transition-colors hover:text-banner-foreground hover:underline',
		$page.url.pathname.startsWith(href) ? 'text-banner-foreground' : 'text-banner-foreground/60',
		className
	)}
>
	{title}
</a>
