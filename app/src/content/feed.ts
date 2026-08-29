import { sortPostsByDateDesc } from "../lib/sort";
import { plainTitle } from "../lib/title";
import { getPublishedPosts } from "./posts";
import { getSitemapPaths } from "./route-paths";

/**
 * RSS / sitemap の本文を組み立てる純粋な文字列ビルダー群。副作用を持たないため、
 * `routes/rss.xml.ts` / `routes/sitemap.xml.ts` の resource route の loader から
 * 呼ばれ、prerender 時に `dist/client/{rss,sitemap}.xml` へ書き出される。
 * `getPublishedPosts` は Node の `fs` で記事を読むため、`ssr: false` の
 * ビルドプロセス内(ランタイムサーバーなし)からでも実行できる。
 */

const FEED_TITLE = "ごぼうのブログ";
const FEED_DESCRIPTION = "ごぼうのブログです。";

function escapeXml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function buildRss(siteUrl: string): string {
	const items = sortPostsByDateDesc(getPublishedPosts())
		.map((post) => {
			const link = `${siteUrl}/posts/${post.slug}/`;
			return `\t<item>
\t\t<title>${escapeXml(plainTitle(post.data.title))}</title>
\t\t<link>${link}</link>
\t\t<guid>${link}</guid>
\t\t<pubDate>${post.data.date.toUTCString()}</pubDate>
\t</item>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
\t<title>${escapeXml(FEED_TITLE)}</title>
\t<description>${escapeXml(FEED_DESCRIPTION)}</description>
\t<link>${siteUrl}/</link>
${items}
</channel>
</rss>
`;
}

export function buildSitemap(siteUrl: string): string {
	const urls = getSitemapPaths()
		.map((path) => `\t<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
