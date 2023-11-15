export type NavItem = {
	title: string;
	href: string;
	items: NavItem[];
	protected?: boolean;
};

export const navigation: NavItem[] = [
	{
		title: 'Nyheter',
		href: '/news',
		items: []
	},
	{
		title: 'Information',
		href: '/info',
		items: [
			{
				title: 'Om föreningen',
				href: '/info/about',
				items: []
			},
			{
				title: 'Ekonomi',
				href: '/info/economy',
				items: []
			},
			{
				title: 'Renoveringar',
				href: '/info/renovations',
				items: []
			},
			{
				title: 'Stadgar',
				href: '/info/bylaws',
				items: []
			},
			{
				title: 'Styrelsen',
				href: '/info/board',
				items: []
			}
		]
	},
	{
		title: 'Tvättstuga',
		href: '/laundry',
		items: []
	},
	{
		title: 'Kontakt',
		href: '/contact',
		items: []
	}
];
