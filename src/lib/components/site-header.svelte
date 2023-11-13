<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { MainNav, MobileNav } from '$lib/components/navigation';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import type { User } from '$lib/types';

	export let user: User | undefined;

	let open = false;
	afterNavigate(() => {
		open = false;
	});
</script>

<header
	class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 items-center">
		<MainNav />
		<MobileNav />
		<div class="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
			<div class="w-full flex-1 md:w-auto md:flex-none">
				<!-- command menu here? -->
			</div>
			<div class="flex items-center gap-3">
				{#if user}
					<a href="/profile" class="hover:underline">
						{user.name}
					</a>
					<Popover.Root bind:open>
						<Popover.Trigger>
							<Avatar.Root>
								<Avatar.Image src={user.avatar} alt={user.name} class="hover:scale-110" />
								<Avatar.Fallback>{user.name}</Avatar.Fallback>
							</Avatar.Root>
						</Popover.Trigger>
						<Popover.Content class="w-56 ">
							<div class="flex w-full flex-col items-center gap-2">
								<div class="w-full">
									<Button variant="outline" href="/profile" class="w-full">View profile</Button>
								</div>
								<div class="w-full">
									<Button variant="outline" href="/profile/edit" class="w-full">Edit profile</Button
									>
								</div>
								<form method="post" action="/auth/sign_out" class="w-full" use:enhance>
									<Button variant="outline" type="submit" class="w-full">Sign out</Button>
								</form>
							</div>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<Button variant="outline" href="/auth/signin">Sign in</Button>
				{/if}
			</div>
		</div>
	</div>
</header>
