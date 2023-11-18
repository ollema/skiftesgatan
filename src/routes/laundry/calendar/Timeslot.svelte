<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Square } from 'radix-icons-svelte';

	export let timeslot: { start: string; end: string };
	export let selected: boolean;
	export let disabled: boolean;

	const baseClasses = 'h-4 rounded-sm border border-dashed p-0 text-xs hover:border-solid';
	const selectedClasses =
		'bg-foreground text-background border-background hover:bg-foreground hover:text-background hover:border-background';
	const classes = `${baseClasses} ${selected ? selectedClasses : ''}`;
</script>

<div class="block min-[500px]:hidden">
	<Square class="h-[5px] w-[5px]" />
</div>

<Button variant="ghost" class="hidden min-[500px]:block md:hidden {classes}" {disabled}>
	{timeslot.start.replace(':00', '')}
</Button>

<Button variant="ghost" class="hidden md:block {classes}" {disabled}>
	{timeslot.start.replace(':00', '')} - {timeslot.end.replace(':00', '')}
</Button>

<style lang="postcss"></style>
