<script lang="ts">
	import { Calendar } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LaundryDay from '$lib/components/calendars/laundry-day.svelte';
	import { CalendarDate } from '@internationalized/date';
	import type { LaundryBookingGrid } from '$lib/types/bookings';

	interface Props {
		today: CalendarDate;
		bookings: LaundryBookingGrid;
	}

	let { today, bookings }: Props = $props();

	let value = $state(today);
</script>

<Calendar.Root
	type="single"
	minValue={today}
	maxValue={today.add({ months: 1 })}
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

{value}
