<script lang="ts">
	import { formatDayOfWeek } from './helpers';

	export let dayOfWeek: Date;
</script>

<th class="block bg-background capitalize text-foreground sm:hidden">
	{formatDayOfWeek(dayOfWeek, 'narrow')}
</th>

<th class="hidden bg-background capitalize text-foreground sm:block">
	{formatDayOfWeek(dayOfWeek, 'long')}
</th>
