<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	export let data;
</script>

{#each data.providers as provider}
	<form method="post">
		<Button type="submit">
			<input type="hidden" name="authProvider" value={provider.name} />
			{provider.name}
		</Button>
	</form>
{/each}
