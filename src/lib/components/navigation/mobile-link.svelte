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
		'font-semibold transition-colors hover:text-white hover:underline',
		$page.url.pathname.startsWith(href) ? 'text-white' : 'text-white/60',
		className
	)}
>
	{title}
</a>
