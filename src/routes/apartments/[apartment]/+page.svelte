<script>
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';

	export let data;

	const title = `Lägenhet ${data.apartment.apartment}`;
	const description = 'Information om din lägenhet.';
</script>

<MetaTags {title} {description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{title}</PageHeader.Title>
		<PageHeader.Description>{description}</PageHeader.Description>
	</PageHeader.Heading>
</PageHeader.Root>

<div class="flex flex-col gap-4">
	<div>
		<h4>Storlek</h4>
		<p>{data.apartment.size} kvm</p>
	</div>

	<div>
		{#if data.owners.length > 0}
			<h4>Boende</h4>
			<div class="flex flex-col gap-2">
				{#each data.owners as owner}
					<p>
						{owner}
						{#if data.user && data.user.name === owner}
							(du)
						{/if}
					</p>
				{/each}
			</div>
		{/if}
	</div>

	<div>
		{#if data.subtenants.length > 0}
			<h4>Hyresgäster</h4>
			<div class="flex flex-col gap-2">
				{#each data.subtenants as subtenant}
					<p>
						{subtenant}
						{#if data.user && data.user.name === subtenant}
							(du)
						{/if}
					</p>
				{/each}
			</div>
		{/if}
	</div>
</div>
