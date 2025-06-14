<script lang="ts">
	import type { CalendarDateTime, DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { isToday as isDateToday } from '@internationalized/date';
	import LaundryTimeSlot from '$lib/components/calendars/laundry-time-slot.svelte';
	import type { BookingWithUser } from '$lib/types/bookings';
	import { LAUNDRY_SLOTS } from '$lib/constants/bookings';

	interface Props {
		date: DateValue;
		now: CalendarDateTime;
		disabled: boolean;
		selected: boolean;
		bookings: [
			BookingWithUser | null,
			BookingWithUser | null,
			BookingWithUser | null,
			BookingWithUser | null
		];
	}

	let { date, now, disabled, selected, bookings }: Props = $props();

	const isToday = $derived(isDateToday(date, 'Europe/Stockholm'));
</script>

<div
	class={cn(
		'focus:ring-foreground/60 flex h-full min-h-[27px] w-full cursor-pointer items-center justify-between p-1 focus:ring-2 focus:outline-none focus:ring-inset sm:min-h-20',
		selected && '!ring-foreground ring-2 ring-inset',
		disabled && 'text-foreground/70 pointer-events-none',
		'group-data-outside-visible-months:text-foreground/70 group-data-outside-visible-months:bg-foreground/80 group-data-outside-visible-months:pointer-events-none'
	)}
>
	<div class="grow-0 text-xs sm:text-base">
		<div
			class={cn(
				isToday &&
					'bg-foreground text-background flex h-4 w-4 items-center justify-center rounded-md text-center sm:h-5 sm:w-5'
			)}
		>
			{date.day}
		</div>
	</div>

	{#if !disabled}
		<div>
			<div class="flex flex-col justify-center gap-[1px] sm:gap-[3px]">
				{#each LAUNDRY_SLOTS as timeslot, i (timeslot)}
					<LaundryTimeSlot {date} {now} {timeslot} booking={bookings[i]} />
				{/each}
			</div>
		</div>
	{/if}
</div>
