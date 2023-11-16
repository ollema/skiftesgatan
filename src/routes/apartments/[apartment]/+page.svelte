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
		<h3>Storlek</h3>
		<p>{data.apartment.size} kvm</p>
	</div>

	<div>
		{#if data.apartment.expand?.owners}
			<h3>Boende</h3>
			<div class="flex flex-col gap-2">
				{#each data.apartment.expand.owners as owner}
					<div class="grid grid-cols-[3.5rem_1fr]">
						<p>Namn:</p>
						<p>{owner.name}</p>
						<p>Email:</p>
						<p>{owner.email}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
