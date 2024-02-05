<script>
	export let data;
</script>

<article class="content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.page.content}
</article>

<style lang="postcss">
	:global(article > *) {
		font-family: 'Lora Variable', serif !important;
	}

	:global(h4) {
		margin-top: 1rem !important;
	}

	:global(ul) {
		list-style: square !important ;
	}

	:global(ul > li) {
		margin-left: 1.5rem !important;
	}
</style>
