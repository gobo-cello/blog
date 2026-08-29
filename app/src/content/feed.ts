import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveSiteConfig } from "../config/site";
import { sortPostsByDateDesc } from "../lib/sort";
import { plainTitle } from "../lib/title";
import { getPublishedPosts } from "./posts";
import { getSitemapPaths } from "./route-paths";

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

function buildRss(siteUrl: string): string {
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

function buildSitemap(siteUrl: string): string {
	const urls = getSitemapPaths()
		.map((path) => `\t<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * RSS / sitemap は React Router の integration を持たないため、
 * `react-router.config.ts` の `buildEnd` から prerender 済みの静的ファイル群
 * (`dist/client/`)へ直接書き出す。`getPublishedPosts` は Node の `fs` で
 * 記事を読むため、Vite / React Router のビルドプロセス外からでも呼べる。
 */
export function writeFeedFiles(clientDir: string): void {
	const siteUrl = resolveSiteConfig(process.env).siteUrl;
	writeFileSync(join(clientDir, "rss.xml"), buildRss(siteUrl));
	writeFileSync(join(clientDir, "sitemap.xml"), buildSitemap(siteUrl));
}
