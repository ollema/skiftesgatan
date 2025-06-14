<script lang="ts">
	import { Calendar } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LaundryDay from '$lib/components/calendars/laundry-day.svelte';
	import { CalendarDateTime, toCalendarDate } from '@internationalized/date';
	import type { BookingWithUser, LaundryBookingGrid } from '$lib/types/bookings';
	import { LAUNDRY_SLOTS } from '$lib/constants/bookings';
	import LaundryTimeSlot from './laundry-time-slot.svelte';

	interface Props {
		now: CalendarDateTime;
		bookings: LaundryBookingGrid;
		userBooking: BookingWithUser | null;
	}

	let { now, bookings, userBooking }: Props = $props();

	let value = $state(toCalendarDate(now));

	function userBookingToString(booking: BookingWithUser | null): string {
		if (!booking) return '-';
		const date = booking.start.toString().split('T')[0];
		const startHour = booking.start.hour.toString().padStart(2, '0');
		const endHour = booking.end.hour.toString().padStart(2, '0');
		return `${date} ${startHour}:00-${endHour}:00`;
	}
</script>

<Calendar.Root
	class="font-serif"
	type="single"
	minValue={toCalendarDate(now)}
	maxValue={toCalendarDate(now.add({ months: 1 }))}
	disableDaysOutsideMonth={true}
	fixedWeeks={true}
	weekdayFormat="short"
	locale="sv-SE"
	initialFocus={true}
	preventDeselect={true}
	calendarLabel="Tvättstugebokningar"
	bind:value
>
	{#snippet children({ months, weekdays })}
		<Calendar.Header class="flex w-full items-center justify-center pb-2">
			<Calendar.PrevButton class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
				<ChevronLeft />
			</Calendar.PrevButton>
			<Calendar.Heading />
			<Calendar.NextButton class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
				<ChevronRight />
			</Calendar.NextButton>
		</Calendar.Header>

		{#each months as month (month.value)}
			<Calendar.Grid class="w-full border-collapse space-y-1 select-none">
				<Calendar.GridHead>
					<Calendar.GridRow>
						{#each weekdays as day (day)}
							<Calendar.HeadCell class="w-10 border text-xs font-bold">
								{day}
							</Calendar.HeadCell>
						{/each}
					</Calendar.GridRow>
				</Calendar.GridHead>
				<Calendar.GridBody>
					{#each month.weeks as weekDates (weekDates)}
						<Calendar.GridRow>
							{#each weekDates as date, index (index)}
								<Calendar.Cell {date} month={month.value} class="border">
									<Calendar.Day class="group">
										{#snippet children({ disabled, selected })}
											<LaundryDay
												{date}
												{now}
												{disabled}
												{selected}
												bookings={bookings[date.toString()]}
											/>
										{/snippet}
									</Calendar.Day>
								</Calendar.Cell>
							{/each}
						</Calendar.GridRow>
					{/each}
				</Calendar.GridBody>
			</Calendar.Grid>
		{/each}
	{/snippet}
</Calendar.Root>

<div class="flex flex-col gap-2 font-serif sm:flex-row sm:justify-between">
	{#if value}
		<div class="mt-4">
			<div>
				{value}
			</div>
			<div class="mt-2 flex gap-2">
				{#each LAUNDRY_SLOTS as timeslot, i (timeslot)}
					<LaundryTimeSlot date={value} {now} {timeslot} booking={bookings[value.toString()][i]} />
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-4">
		<div class="sm:text-right">Din bokning</div>
		<div class="mt-2">
			<div class="sm:text-right">
				{(userBooking && userBookingToString(userBooking)) || '-'}
			</div>
		</div>
	</div>
</div>
