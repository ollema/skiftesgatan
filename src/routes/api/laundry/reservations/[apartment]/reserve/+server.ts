import { getApartment, reserve } from '$lib/pocketbase';

export const POST = async ({ request, locals, params }) => {
	const { start, end } = await request.json();
	const apartment = await getApartment(locals.pb, params.apartment);
	await reserve(locals.pb, apartment, start, end);

	return new Response('ok');
};
