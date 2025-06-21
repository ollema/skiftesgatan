<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { sidebarNavItems } from '$lib/navigation.js';
	import { route } from '$lib/routes';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	type MobileLinkProps = HTMLAnchorAttributes & {
		content?: string;
	};

	let { class: className, ...restProps }: ButtonProps = $props();

	let open = $state(false);
</script>

{#snippet MobileLink({ href, content, class: className, ...props }: MobileLinkProps)}
	<a
		{href}
		onclick={() => {
			open = false;
		}}
		class={cn('text-xl font-medium', className)}
		{...props}
	>
		{content}
	</a>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				{...restProps}
				variant="ghost"
				class={cn(
					'h-8 touch-manipulation items-center justify-start gap-2.5 !p-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent dark:hover:bg-transparent',
					className
				)}
			>
				<div class="relative flex h-8 w-4 items-center justify-center">
					<div class="relative size-4">
						<span
							class={cn(
								'bg-background absolute left-0 block h-0.5 w-4 transition-all duration-100',
								open ? 'top-[0.4rem] -rotate-45' : 'top-1'
							)}
						></span>
						<span
							class={cn(
								'bg-background absolute left-0 block h-0.5 w-4 transition-all duration-100',
								open ? 'top-[0.4rem] rotate-45' : 'top-2.5'
							)}
						></span>
					</div>
				</div>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content
		class="bg-background/90 no-scrollbar h-(--bits-popover-content-available-height) w-(--bits-popover-content-available-width) overflow-y-auto rounded-none border-none p-0 shadow-none backdrop-blur duration-100"
		align="start"
		side="bottom"
		alignOffset={-16}
		sideOffset={14}
		preventScroll
	>
		<div class="flex h-full flex-col justify-between gap-6 overflow-auto px-6 py-6">
			<div class="flex flex-col gap-6">
				{#each sidebarNavItems as group (group.title)}
					{#if !group.items || group.items.length === 0}
						{@render MobileLink({
							href: group.href,
							content: group.title
						})}
					{:else}
						<div class="flex flex-col gap-3">
							<div class="text-muted-foreground text-sm font-medium">
								{group.title}
							</div>
							<div class="flex flex-col gap-3">
								{#each group.items as item, i (i)}
									{@render MobileLink({ href: item.href, content: item.title })}
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
			{#if page.data.user === null}
				<a
					href={route('/auth/sign-in')}
					onclick={() => {
						open = false;
					}}
					class="text-xl font-medium">Logga in</a
				>
			{:else}
				<div class="flex flex-col gap-3">
					<div class="text-muted-foreground text-sm font-medium">
						{page.data.user.apartment}
					</div>
					<div class="flex flex-col gap-3">
						<a
							href={route('/settings')}
							onclick={() => {
								open = false;
							}}
							class="text-xl font-medium">Inställningar</a
						>
						<form
							id="sign-out-form"
							method="post"
							action={route('default /auth/sign-out')}
							use:enhance
						>
							<button
								id="sign-out-form-button"
								onclick={() => {
									open = false;
								}}
								type="submit"
								class="text-xl font-medium"
							>
								Logga ut
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
