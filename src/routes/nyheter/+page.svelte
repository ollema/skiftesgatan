<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Nyheter</title>
	<meta data-key="description" name="description" content="BRF Skiftesgatan 4 - nyheter" />
</svelte:head>

<h3>Nyheter</h3>

<div class="posts">
	{#each data.posts as post}
		<article class="post">
			<div class="title"><a href="/nyheter/{post.slug}">{post.title}</a></div>
			<div class="meta">{post.date}</div>
		</article>
	{/each}
</div>

<style lang="postcss">
	.posts {
		margin-top: var(--size-3);
	}

	.post {
		margin-bottom: var(--size-3);
	}

	.title {
		font-size: var(--font-size-3);
		font-weight: var(--font-weight-6);
	}

	.meta {
		color: var(--text-2);
		font-size: var(--font-size);
	}
</style>
