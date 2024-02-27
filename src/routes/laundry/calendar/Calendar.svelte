<script lang="ts">
	import { Calendar } from 'bits-ui';
	import ChevronLeft from 'svelte-radix/ChevronLeft.svelte';
	import ChevronRight from 'svelte-radix/ChevronRight.svelte';
	import LaundryDate from './LaundryDate.svelte';
	import Timeslot from './Timeslot.svelte';

	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { formatDay, formatPocketBaseReservation, getTodaysDate, toDate } from './helpers';
	import { timeslots } from './timeslots';

	import { page } from '$app/stores';

	const today = getTodaysDate();

	let value = today;
</script>

<Calendar.Root
	minValue={today}
	maxValue={today.add({ months: 1 })}
	locale={'sv-SE'}
	weekdayFormat={'short'}
	fixedWeeks={true}
	preventDeselect={true}
	initialFocus={true}
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
								<Calendar.Day asChild let:builder let:disabled {date} month={month.value}>
									<LaundryDate
										{date}
										{disabled}
										reservations={$page.data.reservations[date.toString()]}
										apartment={$page.data.apartment}
										builders={[builder]}
									/>
								</Calendar.Day>
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
							reservation={$page.data.reservations[value.toString()]
								? $page.data.reservations[value.toString()][timeslot.start.toString()]
								: undefined}
							apartment={$page.data.apartment}
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
					{($page.data.reservation && formatPocketBaseReservation($page.data.reservation)) || '-'}
				</p>
			</div>
		</div>
	</div>
</Calendar.Root>
