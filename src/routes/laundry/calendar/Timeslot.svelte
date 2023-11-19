<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Square } from 'radix-icons-svelte';

	export let timeslot: { start: string; end: string };
	export let disabled: boolean;
	export let responsive = true;

	$: responsiveSquareClass = responsive ? 'sm:hidden' : 'hidden';
	$: responsiveButtonClasses = responsive ? 'hidden sm:block' : '';
</script>

<div class="flex justify-end {responsiveSquareClass}">
	<Square class="h-[5px] w-[5px]" />
</div>

<Button
	variant="ghost"
	class="h-4 w-12 rounded-sm border border-dashed p-0 text-xs hover:border-solid {responsiveButtonClasses}"
	{disabled}
>
	{timeslot.start.replace(':00', '')} - {timeslot.end.replace(':00', '')}
</Button>
