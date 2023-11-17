<script lang="ts">
	import Cell from './Cell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import { createCalendar, melt } from '@melt-ui/svelte';
	import { formatDayOfWeek, getTodaysDate, getWeekFromDate, toDate } from './helpers';

	const locale = 'sv-SE';
	const todaysDate = getTodaysDate();

	const {
		elements: { calendar, heading, grid, cell, prevButton, nextButton },
		states: { months, headingValue, daysOfWeek },
		helpers: { isDateDisabled, isDateUnavailable }
	} = createCalendar({
		defaultValue: todaysDate,
		minValue: todaysDate.subtract({ days: todaysDate.day - 1 }),
		maxValue: todaysDate.add({ months: 1 }),
		fixedWeeks: true,
		preventDeselect: true,
		locale: locale
	});

	const timeslots = [
		{
			start: '07:00',
			end: '11:00'
		},
		{
			start: '11:00',
			end: '15:00'
		},
		{
			start: '15:00',
			end: '19:00'
		},
		{
			start: '19:00',
			end: '22:00'
		}
	];
</script>

<div use:melt={$calendar} class="w-full rounded-lg p-3 font-serif">
	<header class="flex w-full items-center justify-center pb-2">
		<Button builders={[$prevButton]} variant="ghost"><ChevronLeft /></Button>
		<div use:melt={$heading}>
			{$headingValue}
		</div>
		<Button builders={[$nextButton]} variant="ghost"><ChevronRight /></Button>
	</header>

	{#each $months as month}
		<table use:melt={$grid}>
			<thead aria-hidden="true" class="contents">
				<tr class="contents">
					<th class="hidden bg-background md:block">v</th>
					{#each $months[0].weeks[0].map((d) => toDate(d)) as dayOfWeek}
						<th class="capitalize sm:hidden">
							{formatDayOfWeek(dayOfWeek, 'narrow')}
						</th>
						<th class="hidden capitalize sm:block md:hidden">
							{formatDayOfWeek(dayOfWeek, 'short')}
						</th>
						<th class="hidden capitalize md:block">
							{formatDayOfWeek(dayOfWeek, 'long')}
						</th>
					{/each}
				</tr>
			</thead>

			<tbody class="contents">
				{#each month.weeks as weekDates}
					<tr class="contents">
						<td class="hidden bg-background md:block">
							{getWeekFromDate(weekDates[3])}
						</td>
						{#each weekDates as date}
							<td
								role="gridcell"
								aria-disabled={$isDateDisabled(date) || $isDateUnavailable(date)}
								class="bg-background"
							>
								<div
									use:melt={$cell(date, month.value)}
									class="flex w-full cursor-pointer select-none items-center justify-center border-2 border-transparent hover:bg-accent/20 focus:border-foreground/60 data-[selected]:border-foreground"
								>
									<Cell {date} {todaysDate} {timeslots} />
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</div>

<style lang="postcss">
	table {
		@apply mx-auto grid w-full grid-cols-[repeat(7,1fr)] gap-[1px] bg-foreground md:grid-cols-[2rem_repeat(7,1fr)];
	}

	th {
		@apply bg-background;
	}

	[data-melt-calendar-cell][data-disabled] {
		@apply pointer-events-none opacity-40;
	}

	[data-melt-calendar-cell][data-unavailable] {
		@apply pointer-events-none line-through opacity-40;
	}

	[data-melt-calendar-cell][data-outside-visible-months] {
		@apply pointer-events-none cursor-default opacity-40 hover:bg-transparent;
	}

	[data-melt-calendar-cell][data-outside-month] {
		@apply pointer-events-none cursor-default opacity-20 hover:bg-transparent;
	}
</style>
