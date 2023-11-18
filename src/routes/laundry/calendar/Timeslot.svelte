<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Square } from 'radix-icons-svelte';

	export let timeslot: { start: string; end: string };
	export let selected: boolean;
	export let disabled: boolean;

	const baseClasses = 'h-4 rounded-sm border border-dashed p-0 text-xs hover:border-solid';
	const selectedClasses =
		'bg-foreground text-background border-background hover:bg-foreground hover:text-background hover:border-background';
	$: classes = `${baseClasses} ${selected ? selectedClasses : ''}`;
</script>

<div class="flex justify-end sm:hidden">
	<Square class="h-[5px] w-[5px]" />
</div>

<Button variant="ghost" class="hidden sm:block {classes}" {disabled}>
	{timeslot.start.replace(':00', '')} - {timeslot.end.replace(':00', '')}
</Button>
