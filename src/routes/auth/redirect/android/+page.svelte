<script lang="ts">
	import { page } from '$app/stores';

	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex flex-col items-center justify-center gap-4 pt-8">
	<h2>Logga in</h2>

	<p>Klicka på knappen nedan för att öppna appen och slutföra inloggningen</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		<Button variant="outline" href={$page.url.href}>
			<div class="font-sans font-semibold">Öppna appen</div>
		</Button>
	</div>
</div>
