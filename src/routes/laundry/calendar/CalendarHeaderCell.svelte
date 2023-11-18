<script lang="ts">
	import { formatDayOfWeek } from './helpers';

	export let dayOfWeek: Date;
</script>

<th class="bg-background capitalize sm:hidden">
	{formatDayOfWeek(dayOfWeek, 'narrow')}
</th>
<th class="hidden bg-background capitalize sm:block md:hidden">
	{formatDayOfWeek(dayOfWeek, 'short')}
</th>
<th class=" hidden bg-background capitalize md:block">
	{formatDayOfWeek(dayOfWeek, 'long')}
</th>
