import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const posts = await getCollection("blog", ({ data }) => !data.draft);

	return rss({
		title: "gobo-cello.com",
		description: "gobo-cello.comのブログです。",
		site: context.site ?? new URL("https://blog.gobo-cello.com"),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `/posts/${post.id}/`,
		})),
	});
}
