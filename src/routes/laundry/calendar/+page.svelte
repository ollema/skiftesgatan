<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';
	import * as Calendar from '$lib/components/calendar';
	import Cell from './Cell.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';

	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { formatDay, formatDayOfWeek, getTodaysDate, toDate } from './helpers';
	import Timeslot from './Timeslot.svelte';

	const today = getTodaysDate();

	export let data;

	const title = 'Tvättstuga - bokningar';
	const description = 'Bokade tider i vår tvättstuga';
</script>

<MetaTags {title} {description} />

<PageHeader.Root>
	<PageHeader.Heading>
		<PageHeader.Title>{title}</PageHeader.Title>
	</PageHeader.Heading>
</PageHeader.Root>

<Calendar.Root
	class="mx-auto w-full max-w-screen-lg font-serif"
	let:value
	let:months
	value={today}
	minValue={today}
	maxValue={today.add({ months: 1 })}
	locale={'sv-SE'}
	fixedWeeks={true}
	preventDeselect={true}
>
	<Calendar.Header class="no-spacing flex w-full items-center justify-center pb-2">
		<Calendar.PrevButton class={cn(buttonVariants({ variant: 'ghost' }))}>
			<ChevronLeft class="h-4 w-4" />
		</Calendar.PrevButton>
		<Calendar.Heading class="" />
		<Calendar.NextButton class={cn(buttonVariants({ variant: 'ghost' }))}>
			<ChevronRight class="h-4 w-4" />
		</Calendar.NextButton>
	</Calendar.Header>
	{#each months as month}
		<Calendar.Grid class="grid w-full grid-cols-7 gap-[1px] bg-foreground p-[1px]">
			<Calendar.GridHead class="contents">
				<Calendar.GridRow class="contents">
					{#each months[0].weeks[0].map((d) => toDate(d)) as dayOfWeek}
						<Calendar.GridHeadCell>
							<div class="w-full overflow-hidden">{formatDayOfWeek(dayOfWeek)}</div>
						</Calendar.GridHeadCell>
					{/each}
				</Calendar.GridRow>
			</Calendar.GridHead>
			<Calendar.GridBody class="contents">
				{#each month.weeks as weekDates}
					<Calendar.GridRow class="contents">
						{#each weekDates as date}
							<Calendar.GridBodyCell {date}>
								<Cell {date} month={month.value} timeslots={data.timeslots} />
							</Calendar.GridBodyCell>
						{/each}
					</Calendar.GridRow>
				{/each}
			</Calendar.GridBody>
		</Calendar.Grid>
	{/each}

	{#if value}
		<div class="mt-4">
			<h4 class="font-serif">
				{formatDay(toDate(value))}
			</h4>
			<div class="mt-1 flex gap-2">
				{#each data.timeslots as timeslot}
					<Timeslot {timeslot} disabled={false} responsive={false} />
				{/each}
			</div>
		</div>
	{/if}
</Calendar.Root>
