<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import { melt } from '@melt-ui/svelte';

	export let heading: any;
	export let headingValue: any;
	export let prevButton: any;
	export let nextButton: any;
</script>

<header class="flex w-full items-center justify-center pb-2">
	<Button builders={[$prevButton]} variant="ghost"><ChevronLeft /></Button>
	<div use:melt={$heading}>
		{$headingValue}
	</div>
	<Button builders={[$nextButton]} variant="ghost"><ChevronRight /></Button>
</header>
