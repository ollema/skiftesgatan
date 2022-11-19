<script lang="ts">
	import '../openprops.css';
	import '../app.css';

	import Sun from '~icons/ri/sun-fill';
	import Moon from '~icons/ri/moon-fill';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	$: section = $page.url.pathname.split('/')[1];

	let theme: string;

	onMount(() => {
		// get the current theme from localStorage
		theme = localStorage.theme;

		// add event listener to listen for changes in prefers-color-scheme
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (e.matches) {
				theme = 'dark';
			} else {
				theme = 'light';
			}
			localStorage.theme = theme;
			document.documentElement.setAttribute('data-theme', theme);
		});
	});

	function toggleTheme() {
		if (theme === 'dark') {
			theme = 'light';
		} else {
			theme = 'dark';
		}
		localStorage.theme = theme;
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<svelte:head>
	<script lang="ts">
		if (document) {
			let theme = localStorage.theme;
			if (theme) {
				document.documentElement.setAttribute('data-theme', theme);
			} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.setAttribute('data-theme', 'dark');
				localStorage.theme = 'dark';
			} else {
				document.documentElement.setAttribute('data-theme', 'light');
				localStorage.theme = 'light';
			}
		}
	</script>
</svelte:head>

<nav data-sveltekit-prefetch>
	<div>
		<ul>
			<li><a href="/" class:selected={section === ''}>Hem</a></li>
			<li><a href="/nyheter" class:selected={section === 'new'}>Nyheter</a></li>
			<li><a href="/foreningen" class:selected={section === 'ask'}>Föreningen</a></li>
			<li><a href="/mitt-boende" class:selected={section === 'show'}>Mitt boende</a></li>
		</ul>

		<button class="theme-toggle" id="theme-toggle" on:click={toggleTheme}>
			{#if theme === 'light'}
				<Sun width="24" height="24" />
			{:else}
				<Moon width="24" height="24" />
			{/if}
		</button>
	</div>
</nav>

<main data-sveltekit-prefetch>
	<slot />
</main>

<style lang="postcss">
	nav {
		background: var(--surface-2);

		& div {
			display: flex;
			justify-content: space-between;

			max-width: var(--size-lg);
			margin: 0 auto;

			& ul {
				display: flex;

				padding: var(--size-1) 0;

				list-style: none;

				& li {
					padding: var(--size-2) var(--size-3);

					& a {
						color: var(--text-1);
						font-weight: var(--font-weight-5);
						font-size: var(--font-size-3);
						text-decoration: none;

						&:hover {
							color: var(--text-2);
						}
					}
				}
			}

			& button {
				padding: 0 var(--size-3);

				background: unset;
				color: unset;
			}
		}
	}

	main {
		max-width: var(--size-lg);
		margin: 0 auto;
		padding: var(--size-3) var(--size-3);
	}
</style>
