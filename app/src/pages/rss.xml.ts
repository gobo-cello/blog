import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { resolveSiteUrl } from "../lib/site-url";
import { plainTitle } from "../lib/title";

export const GET = async (context: APIContext) => {
	const posts = await getCollection("posts", ({ data }) => !data.draft);

	return rss({
		title: "ごぼうのブログ",
		description: "ごぼうのブログです。",
		site: context.site ?? new URL(resolveSiteUrl(process.env.BLOG_DOMAIN_NAME)),
		items: posts.map((post) => ({
			title: plainTitle(post.data.title),
			pubDate: post.data.date,
			link: `/posts/${post.id}/`,
		})),
	});
};
