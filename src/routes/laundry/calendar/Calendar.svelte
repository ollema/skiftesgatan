<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import { createCalendar, melt } from '@melt-ui/svelte';
	import { getTodaysDate, getWeekFromDate } from './helpers';

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
		isDateUnavailable: (date) => {
			return date < todaysDate;
		},
		fixedWeeks: true,
		preventDeselect: true,
		locale: locale
	});

	const headers = ['v', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
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
		<table
			use:melt={$grid}
			class="grid w-full grid-cols-[2rem_repeat(7,1fr)] gap-[1px] bg-foreground"
		>
			<thead aria-hidden="true" class="contents">
				<tr class="contents">
					{#each headers as header}
						<th class="bg-background">{header}</th>
					{/each}
				</tr>
			</thead>

			<tbody class="contents">
				{#each month.weeks as weekDates}
					<tr class="contents">
						<td class="bg-background">
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
									{date.day}
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
