<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as PageHeader from '$lib/components/page-header';
	import { Calendar } from 'bits-ui';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import LaundryDate from './LaundryDate.svelte';
	import Timeslot from './Timeslot.svelte';

	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { formatDay, formatPocketBaseReservation, getTodaysDate, toDate } from './helpers';
	import { timeslots } from './timeslots';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';

	const today = getTodaysDate();

	let value = today;

	export let data;

	// refresh every 10 seconds while page is open
	onMount(() => {
		const refresher = setInterval(() => {
			invalidate('laundry:calendar');
		}, 1000 * 10);

		return () => {
			clearInterval(refresher);
		};
	});

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
	minValue={today}
	maxValue={today.add({ months: 1 })}
	locale={'sv-SE'}
	weekdayFormat={'short'}
	fixedWeeks={true}
	preventDeselect={true}
	class="mx-auto w-full max-w-screen-lg font-serif"
	let:weekdays
	let:months
	bind:value
>
	<Calendar.Header class="flex w-full items-center justify-center pb-2">
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
					{#each weekdays as day}
						<Calendar.HeadCell class="!important bg-background p-0 text-foreground">
							<div class="w-full overflow-hidden">{day}</div>
						</Calendar.HeadCell>
					{/each}
				</Calendar.GridRow>
			</Calendar.GridHead>
			<Calendar.GridBody class="contents">
				{#each month.weeks as weekDates}
					<Calendar.GridRow class="contents">
						{#each weekDates as date}
							<Calendar.Cell {date} class="!important p-0">
								<Calendar.Date asChild let:builder let:disabled {date} month={month.value}>
									<LaundryDate
										{date}
										{disabled}
										reservations={data.reservations[date.toString()]}
										apartment={data.apartment}
										builders={[builder]}
									/>
								</Calendar.Date>
							</Calendar.Cell>
						{/each}
					</Calendar.GridRow>
				{/each}
			</Calendar.GridBody>
		</Calendar.Grid>
	{/each}

	<div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
		{#if value}
			<div class="mt-4">
				<h4 class="font-serif">
					{formatDay(toDate(value))}
				</h4>
				<div class="mt-2 flex gap-2">
					{#each timeslots as timeslot}
						<Timeslot
							date={value}
							{timeslot}
							reservation={data.reservations[value.toString()]
								? data.reservations[value.toString()][timeslot.start.toString()]
								: undefined}
							apartment={data.apartment}
							responsive={false}
						/>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mt-4">
			<h4 class="font-serif sm:text-right">Din bokning</h4>
			<div class="mt-2">
				<p class="sm:text-right">
					{(data.reservation && formatPocketBaseReservation(data.reservation)) || '-'}
				</p>
			</div>
		</div>
	</div>
</Calendar.Root>
