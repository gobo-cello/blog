import { resolveSiteConfig } from "../config/site";
import { buildRss } from "../content/feed";

/**
 * default export を持たず loader だけを持つ resource route。`ssr: false` でも
 * prerender 対象パス(`route-paths.ts` の `/rss.xml`)に含まれていれば、ビルド
 * プロセス内で loader が実行され、戻り値の本文が `dist/client/rss.xml` へ
 * そのまま書き出される。配信時にランタイムサーバーは不要。
 */
export function loader() {
	const siteUrl = resolveSiteConfig(process.env).siteUrl;
	return new Response(buildRss(siteUrl), {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
}
