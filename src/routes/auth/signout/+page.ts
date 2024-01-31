import { signout } from '$lib/pocketbase';

export const load = async () => {
	signout();
};
