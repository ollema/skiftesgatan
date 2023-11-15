<script>
	import { LightSwitch } from '$lib/components/light-switch';
</script>

<footer class="flex h-14 items-center border-t-2 bg-foreground">
	<div class="container flex items-center justify-between gap-4">
		<div class="text-sm text-white md:text-base">
			Byggd av
			<a
				href="https://github.com/ollema"
				class="font-semibold hover:underline"
				target="_blank"
				rel="external"
			>
				Olle
			</a>
			<div class="hidden min-[350px]:inline">för BRF Skiftesgatan 4.</div>
		</div>
		<LightSwitch />
	</div>
</footer>
