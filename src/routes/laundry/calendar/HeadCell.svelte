<script lang="ts">
	import { formatDayOfWeek } from './helpers';

	export let dayOfWeek: Date;
</script>

<th class="block bg-background capitalize text-foreground">
	<div class="block sm:hidden">
		{formatDayOfWeek(dayOfWeek, 'narrow')}
	</div>

	<div class="hidden sm:block md:hidden">
		{formatDayOfWeek(dayOfWeek, 'short')}
	</div>

	<div class="hidden md:block">
		{formatDayOfWeek(dayOfWeek, 'long')}
	</div>
</th>
