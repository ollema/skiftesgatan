<script lang="ts">
	import { getAttrs } from '../ctx';
	import type { GridHeadCellProps } from '../types';

	type $$Props = GridHeadCellProps;
	export let asChild: $$Props['asChild'] = false;

	const attrs = getAttrs('grid-head-cell');
</script>

{#if asChild}
	<slot {attrs} />
{:else}
	<th {...$$restProps} {...attrs} class="bg-background p-0 text-foreground">
		<slot />
	</th>
{/if}
