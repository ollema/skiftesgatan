import type { Component } from 'svelte';

export type NavItem = {
	title: string;
	description?: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	label?: string;
	icon?: Component;
};

export type MainNavItem = NavItem & {
	items?: Array<MainNavItem>;
};

export type SidebarNavItem = NavItem & {
	items?: Array<SidebarNavItem>;
};

export const mainNavItems: Array<MainNavItem> = [
	{
		title: 'Nyheter',
		href: '#'
	},
	{
		title: 'Information',
		href: '#',
		items: [
			{
				title: 'Om föreningen',
				href: '#',
				description: 'Allmän information om vår bostadsrättsförening.'
			},
			{
				title: 'Ekonomi',
				href: '#',
				description: 'Information om föreningens ekonomi, budget och årsredovisning.'
			},
			{
				title: 'Renoveringar',
				href: '#',
				description: 'Information om planerade och genomförda renoveringar i föreningen.'
			},
			{
				title: 'Stadgar',
				href: '#',
				description: 'Föreningens stadgar och regler som alla medlemmar bör känna till.'
			},
			{
				title: 'Styrelsen',
				href: '#',
				description: 'Information om styrelsemedlemmarna och deras kontaktuppgifter.'
			}
		]
	},
	{
		title: 'Bokningar',
		href: '#',
		items: [
			{
				title: 'Boka tvättstuga',
				href: '/booking/laundry'
			},
			{
				title: 'Boka BBQ/uteplats',
				href: '/booking/bbq'
			}
		]
	},
	{
		title: 'Kontakt',
		href: '#'
	}
];

export const sidebarNavItems: Array<SidebarNavItem> = mainNavItems;
