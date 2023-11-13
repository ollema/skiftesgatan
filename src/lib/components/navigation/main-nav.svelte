<script lang="ts">
	// import { Mikrofabriken } from '$lib/components/icons';

	import { page } from '$app/stores';
	import { siteConfig } from '$lib/config/site';
	import { cn } from '$lib/utils';

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	$: breadcrumbs = $page.url.pathname.split('/').filter((x) => x !== '');
	$: breadcrumbsLinks = breadcrumbs.map((breadcrumb, index) => {
		let label: string;
		if (breadcrumb.includes('@')) {
			label = breadcrumb.toLowerCase();
		} else if (breadcrumb.includes('_')) {
			label = breadcrumb.split('_').map(capitalize).join(' ');
		} else {
			label = capitalize(breadcrumb);
		}
		const href = '/' + breadcrumbs.slice(0, index + 1).join('/');
		return { label, href };
	});
</script>

<nav class="hidden items-center gap-4 md:flex">
	<a href="/" class={cn('flex items-center gap-4 text-lg font-bold hover:underline')}>
		<!-- <Mikrofabriken class="h-10 w-10" /> -->
		{siteConfig.name}
	</a>
	{#each breadcrumbsLinks as breadcrumb}
		<div class="text-muted-foreground">/</div>
		<a
			href={breadcrumb.href}
			class={cn(
				'hover:underline',
				$page.url.pathname === breadcrumb.href
					? 'font-medium text-foreground'
					: 'text-muted-foreground'
			)}>{breadcrumb.label}</a
		>
	{/each}
</nav>
