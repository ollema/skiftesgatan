const timeslots = [
	{
		start: '07:00',
		end: '11:00'
	},
	{
		start: '11:00',
		end: '15:00'
	},
	{
		start: '15:00',
		end: '19:00'
	},
	{
		start: '19:00',
		end: '22:00'
	}
];

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		timeslots: timeslots
	};
};
