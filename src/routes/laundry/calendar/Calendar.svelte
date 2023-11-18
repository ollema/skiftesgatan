<script lang="ts">
	import Header from './Header.svelte';
	import CalendarHeaderCell from './CalendarHeaderCell.svelte';
	import CalendarBodyCell from './CalendarBodyCell.svelte';

	import { createCalendar, melt } from '@melt-ui/svelte';
	import { getTodaysDate, getWeekFromDate, toDate } from './helpers';

	export let timeslots: { start: string; end: string }[];

	const locale = 'sv-SE';
	const todaysDate = getTodaysDate();

	const {
		elements: { calendar, heading, grid, cell, prevButton, nextButton },
		states: { months, headingValue },
		helpers: { isDateDisabled, isDateUnavailable }
	} = createCalendar({
		defaultValue: todaysDate,
		minValue: todaysDate.subtract({ days: todaysDate.day - 1 }),
		maxValue: todaysDate.add({ months: 1 }),
		fixedWeeks: true,
		preventDeselect: true,
		locale: locale
	});
</script>

<div use:melt={$calendar} class="w-full rounded-lg p-3 font-serif">
	<Header {heading} {headingValue} {prevButton} {nextButton}></Header>

	{#each $months as month}
		<table use:melt={$grid}>
			<thead aria-hidden="true" class="contents">
				<tr class="contents">
					<!-- week number header cell-->
					<th class="hidden bg-background text-center md:block">v</th>

					<!-- actual header cells -->
					{#each $months[0].weeks[0].map((d) => toDate(d)) as dayOfWeek}
						<CalendarHeaderCell {dayOfWeek} />
					{/each}
				</tr>
			</thead>

			<tbody class="contents">
				{#each month.weeks as weekDates}
					<tr class="contents">
						<!-- week number body cell-->
						<td class="hidden bg-background text-center md:block">
							{getWeekFromDate(weekDates[3])}
						</td>

						<!-- actual body cells -->
						{#each weekDates as date}
							<CalendarBodyCell
								{date}
								{month}
								{todaysDate}
								{timeslots}
								{isDateDisabled}
								{isDateUnavailable}
								{cell}
							/>
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
