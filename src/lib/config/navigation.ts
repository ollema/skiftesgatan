export interface NavigationItem {
	title: string;
	url?: string;
	items?: NavigationItem[];
}

export const navigation: NavigationItem[] = [
	{
		title: 'Nyheter',
		url: '#'
	},
	{
		title: 'Information',
		url: '#',
		items: [
			{
				title: 'Om föreningen',
				url: '#'
			},
			{
				title: 'Ekonomi',
				url: '#'
			},
			{
				title: 'Renoveringar',
				url: '#'
			},
			{
				title: 'Stadgar',
				url: '#'
			},
			{
				title: 'Styrelsen',
				url: '#'
			}
		]
	},
	{
		title: 'Bokningar',
		url: '#',
		items: [
			{
				title: 'Boka tvättstuga',
				url: '#'
			},
			{
				title: 'Boka uteplats',
				url: '#'
			}
		]
	},
	{
		title: 'Kontakt',
		url: '#'
	}
];
