<script>
	import { LightSwitch } from '$lib/components/light-switch';
</script>

<footer class="flex h-14 items-center border-t">
	<div class="container flex items-center justify-between gap-4">
		<div class="text-center text-sm leading-loose text-muted-foreground md:text-left">
			Built by
			<a
				href="https://github.com/ollema"
				class="font-semibold hover:underline"
				target="_blank"
				rel="external"
			>
				Olle
			</a>
			for
			<a
				href="https://skiftesgatan.com"
				class="font-semibold hover:underline"
				target="_blank"
				rel="external"
			>
				BRF Skiftesgatan 4.
			</a>
		</div>
		<LightSwitch />
	</div>
</footer>
