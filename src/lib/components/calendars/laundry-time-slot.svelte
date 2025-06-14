<script lang="ts">
	import type { BookingWithUser } from '$lib/types/bookings';
	import { cn } from '$lib/utils';

	interface Props {
		timeslot: { label: string };
		booking: BookingWithUser | null;
	}

	let { timeslot, booking }: Props = $props();
</script>

<div
	class="border-foreground/60 block h-[4px] w-[4px] items-center justify-end border sm:hidden"
></div>

<button
	class={cn(
		'border-foreground/80 hidden h-4 w-12 cursor-pointer items-center justify-center rounded-sm border border-dashed p-0 text-xs hover:border-solid sm:flex',
		booking && ' bg-foreground hover:bg-foreground/20'
	)}
>
	{timeslot.label}
</button>
