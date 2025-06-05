<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { ComponentProps } from 'svelte';
	import { navigation } from '$lib/config/navigation';
	import Logo from '$lib/components/logo.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header>
		<div class="px-2 py-2">
			<a class="mr-6 flex flex-shrink-0 items-center text-2xl font-black" href="/">
				<div>Skiftesgatan</div>
				<Logo />
			</a>
		</div>
	</Sidebar.Header>
	<Sidebar.Content class="gap-0">
		{#each navigation as item (item.title)}
			{#if item.items !== undefined}
				<Collapsible.Root title={item.title} open class="group/collapsible">
					<Sidebar.Group>
						<Sidebar.GroupLabel
							class="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
						>
							{#snippet child({ props })}
								<Collapsible.Trigger {...props}>
									{item.title}
									<ChevronRightIcon
										class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
									/>
								</Collapsible.Trigger>
							{/snippet}
						</Sidebar.GroupLabel>
						<Collapsible.Content>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each item.items as subItem (subItem.title)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton>
												{#snippet child({ props })}
													<a href={subItem.href} {...props}>{subItem.title}</a>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Collapsible.Content>
					</Sidebar.Group>
				</Collapsible.Root>
			{:else}
				<Sidebar.Group>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton class="font-medium">
									{#snippet child({ props })}
										<a href={item.href} {...props}>{item.title}</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			{/if}
		{/each}
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
