export const load = async ({ locals }) => {
	return {
		user: locals.user,
		apartment: locals.apartment
	};
};
