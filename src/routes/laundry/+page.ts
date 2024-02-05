import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	await parent();

	redirect(308, '/laundry/calendar');
};
