<script lang="ts">
	import { getAttrs } from '../ctx';
	import type { GridHeadProps } from '../types';

	type $$Props = GridHeadProps;
	export let asChild: $$Props['asChild'] = false;

	const attrs = { ...getAttrs('grid-head'), 'aria-hidden': true };
</script>

{#if asChild}
	<slot {attrs} />
{:else}
	<thead {...$$restProps} {...attrs}>
		<slot />
	</thead>
{/if}
