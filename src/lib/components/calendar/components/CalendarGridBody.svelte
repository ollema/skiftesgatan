<script lang="ts">
	import { getAttrs } from '../ctx';
	import type { GridBodyProps } from '../types';

	type $$Props = GridBodyProps;
	export let asChild: $$Props['asChild'] = false;

	const attrs = getAttrs('grid-body');
</script>

{#if asChild}
	<slot {attrs} />
{:else}
	<tbody {...$$restProps} {...attrs}>
		<slot />
	</tbody>
{/if}
