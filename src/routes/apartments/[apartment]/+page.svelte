<script lang="ts">
	import { AgreementsTypeOptions, type AgreementsRecord } from '$lib/pocketbase-types.js';

	import { page } from '$app/stores';

	export let data;

	function formatAgreementType(agreement: AgreementsRecord) {
		switch (agreement.type) {
			case AgreementsTypeOptions.sublease:
				return 'Andrahandsuthyrning';
			default: {
				const exhaustive: never = agreement.type;
				return exhaustive;
			}
		}
	}

	function formatAgreementDuration(agreement: AgreementsRecord) {
		const options = {
			year: 'numeric' as const,
			month: '2-digit' as const,
			day: '2-digit' as const
		};
		const start = new Date(agreement.start)
			.toLocaleDateString('sv-SE', options)
			.replaceAll('/', '-');
		const end = new Date(agreement.end).toLocaleDateString('sv-SE', options).replaceAll('/', '-');
		return `${start} - ${end}`;
	}
</script>

<div class="flex flex-col gap-4">
	<div>
		<h4>Storlek</h4>
		<p>{data.apartment.size} kvm</p>
	</div>

	{#if data.owners.length > 0}
		<div>
			<h4>Boende</h4>
			<div class="flex flex-col gap-2">
				{#each data.owners as owner}
					<p>
						{owner}
						{#if $page.data.user && $page.data.user.name === owner}
							(du)
						{/if}
					</p>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.subtenants.length > 0}
		<div>
			<h4>Hyresgäster</h4>
			<div class="flex flex-col gap-2">
				{#each data.subtenants as subtenant}
					<p>
						{subtenant}
						{#if $page.data.user && $page.data.user.name === subtenant}
							(du)
						{/if}
					</p>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.agreements.length > 0}
		<div>
			<h4>Avtal</h4>
			<div class="flex flex-col gap-2">
				{#each data.agreements as agreement}
					<div class="flex flex-col font-serif">
						<div class="font-bold">{formatAgreementType(agreement)}</div>
						<div>{formatAgreementDuration(agreement)}</div>
						<a href={agreement.fileUrl} class="underline">Avtal.pdf</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
