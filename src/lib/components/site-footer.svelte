<script>
	import { LightSwitch } from '$lib/components/light-switch';
</script>

<footer class="flex h-14 items-center border-t-2 bg-foreground">
	<div class="container flex items-center justify-between gap-4">
		<div class="text-white">
			Byggd av
			<a
				href="https://github.com/ollema"
				class="font-semibold hover:underline"
				target="_blank"
				rel="external"
			>
				Olle
			</a>
			för BRF Skiftesgatan 4.
		</div>
		<LightSwitch />
	</div>
</footer>
