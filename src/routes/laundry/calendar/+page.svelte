<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';
	import * as Calendar from '$lib/components/calendar';
	import BodyCell from './BodyCell.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';

	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { getTodaysDate } from './helpers';

	const value = getTodaysDate();
	const minValue = value;
	const maxValue = value.add({ months: 1 });
	const locale = 'sv-SE';

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
	let:months
	let:daysOfWeek
	{value}
	{minValue}
	{maxValue}
	{locale}
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
		<Calendar.Grid class="grid w-full grid-cols-7 gap-[1px] bg-foreground">
			<Calendar.GridHead class="contents">
				<Calendar.GridRow class="contents">
					{#each daysOfWeek as day}
						<Calendar.GridHeadCell class="bg-background text-foreground">
							{day}
						</Calendar.GridHeadCell>
					{/each}
				</Calendar.GridRow>
			</Calendar.GridHead>
			<Calendar.GridBody class="contents">
				{#each month.weeks as weekDates}
					<Calendar.GridRow class="contents">
						{#each weekDates as date}
							<Calendar.GridBodyCell {date}>
								<BodyCell {date} month={month.value} timeslots={data.timeslots} />
							</Calendar.GridBodyCell>
						{/each}
					</Calendar.GridRow>
				{/each}
			</Calendar.GridBody>
		</Calendar.Grid>
	{/each}
</Calendar.Root>
