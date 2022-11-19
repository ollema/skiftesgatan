import path from 'path';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const posts = await Promise.all(
		Object.entries(import.meta.glob('/src/lib/posts/*.md')).map(async ([filePath, resolver]) => {
			const { metadata } = (await resolver()) as {
				metadata: {
					title: string;
					description: string;
					date: string;
				};
			};
			const slug: string = path.parse(filePath).name;
			return {
				...metadata,
				slug: slug
			};
		})
	);

	return { posts: posts };
	// console.log(posts);

	// return {
	// 	posts: posts.sort((a, b) => {
	// 		return new Date(b.date).getTime() - new Date(a.date).getTime();
	// 	})
	// };
};
