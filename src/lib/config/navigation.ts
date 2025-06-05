export interface NavigationItem {
	title: string;
	href: string;
	items?: Array<NavigationItem>;
	content?: string;
}

export const navigation: Array<NavigationItem> = [
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
				content: 'Allmän information om vår bostadsrättsförening.'
			},
			{
				title: 'Ekonomi',
				href: '#',
				content: 'Information om föreningens ekonomi, budget och årsredovisning.'
			},
			{
				title: 'Renoveringar',
				href: '#',
				content: 'Information om planerade och genomförda renoveringar i föreningen.'
			},
			{
				title: 'Stadgar',
				href: '#',
				content: 'Föreningens stadgar och regler som alla medlemmar bör känna till.'
			},
			{
				title: 'Styrelsen',
				href: '#',
				content: 'Information om styrelsemedlemmarna och deras kontaktuppgifter.'
			}
		]
	},
	{
		title: 'Bokningar',
		href: '#',
		items: [
			{
				title: 'Boka tvättstuga',
				href: '#'
			},
			{
				title: 'Boka uteplats',
				href: '#'
			}
		]
	},
	{
		title: 'Kontakt',
		href: '#'
	}
];
