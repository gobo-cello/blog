import { resolveSiteConfig } from "../config/site";
import { buildSitemap } from "../content/feed";

/**
 * default export を持たず loader だけを持つ resource route。`ssr: false` でも
 * prerender 対象パス(`route-paths.ts` の `/sitemap.xml`)に含まれていれば、
 * ビルドプロセス内で loader が実行され、戻り値の本文が `dist/client/sitemap.xml`
 * へそのまま書き出される。配信時にランタイムサーバーは不要。
 */
export function loader() {
	const siteUrl = resolveSiteConfig(process.env).siteUrl;
	return new Response(buildSitemap(siteUrl), {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
}
