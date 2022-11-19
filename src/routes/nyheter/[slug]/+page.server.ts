import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const post: {
			metadata: {
				title: string;
				description: string;
				date: string;
			};
			default: any;
		} = await import(`../../../lib/posts/${params.slug}.md`);
		return {
			content: post.default.render().html,
			meta: { ...post.metadata, slug: params.slug }
		};
	} catch (err) {
		throw error(404, 'Not found');
	}
};
