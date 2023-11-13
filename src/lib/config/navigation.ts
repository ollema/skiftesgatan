export type NavItem = {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	label?: string;
	protected?: boolean;
	items: NavItem[];
};

export const navigation: NavItem[] = [
	{
		title: 'Membership',
		items: [
			{
				title: 'Profile',
				href: '/profile',
				items: []
			},
			{
				title: 'Agreements',
				href: '/agreements',
				items: []
			},
			{
				title: 'Artifacts',
				href: '/artifacts',
				items: []
			},
			{
				title: 'Commissions',
				href: '/commissions',
				items: []
			},
			{
				title: 'Invoices',
				href: '/invoices',
				items: []
			}
		]
	},
	{
		title: 'Admin',
		protected: true,
		items: [
			{
				title: 'Members',
				href: '/admin/members',
				items: []
			}
		]
	}
];
