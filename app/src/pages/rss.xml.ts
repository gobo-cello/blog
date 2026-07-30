import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { plainTitle } from "../lib/title";

export async function GET(context: APIContext) {
	const posts = await getCollection("posts", ({ data }) => !data.draft);

	return rss({
		title: "ごぼうのブログ",
		description: "ごぼうのブログです。",
		site:
			context.site ??
			new URL(`https://${process.env.BLOG_DOMAIN_NAME ?? "blog.example.com"}`),
		items: posts.map((post) => ({
			title: plainTitle(post.data.title),
			pubDate: post.data.date,
			link: `/posts/${post.id}/`,
		})),
	});
}
