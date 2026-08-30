import { categoriesWithPosts } from "../lib/categories";
import { sortPostsByDateDesc } from "../lib/sort";
import { getPublishedPosts } from "./posts";

/**
 * prerender するパス一覧と sitemap のパス一覧は、対象となる記事・カテゴリ・タグの
 * 集合が同一で、末尾スラッシュの有無だけが異なる。両者を別々に組み立てると
 * 「カテゴリは記事のあるものだけ」「タグは公開記事の tag を重複排除」といった
 * 導出ルールが二重管理になり、片方だけ直して不整合を生む事故が起きやすい。
 * そのため導出は `getContentRoutePaths` に一本化し、出力形式の差分だけを
 * `getPrerenderPaths` / `getSitemapPaths` で表現する。
 *
 * 末尾スラッシュの扱いには次の制約がある。
 * - prerender: React Router の prerender は末尾スラッシュなしのパスを要求し、
 *   出力はトップページを除き `<path>/index.html` になる。
 * - アプリ内リンク / sitemap: 従来どおり末尾スラッシュ付きの正規 URL を用いる。
 * - `/404`: prerender 専用。エラーページを sitemap に載せてはならないため、
 *   `getSitemapPaths` には含めない。
 *
 * prerender 対象のうち静的ルート(`/` `/rss.xml` `/sitemap.xml`)は `routes.ts` の
 * 定義そのものなので `react-router.config.ts` 側で `getStaticPaths()` から導出する。
 * このモジュールが担うのは、`routes.ts` からは列挙できない部分
 * (記事・カテゴリ・タグの集合から導く動的コンテンツと、`*` splat マッチにしか
 * 現れない `/404`)に限る。
 */

/**
 * prerender / sitemap が共通で対象とする動的ルートの一覧を、
 * パスセグメント(カテゴリ名・タグ名・記事 slug)の配列として返す。
 *
 * - `categories`: 公開記事が 1 件以上あるカテゴリのみ。順序は `CATEGORIES` の
 *   宣言順(`categoriesWithPosts` の仕様)。
 * - `tags`: 公開記事の tag を出現順で重複排除したもの。
 * - `posts`: 公開記事の slug。日付降順(sitemap / RSS / 一覧ページの表示順)。
 *
 * 記事一覧を日付降順に固定してから tag を導出することで、sitemap の出力順が
 * 記事の追加位置に依存せず安定する。
 *
 * prerender / sitemap 用の出力整形は `getPrerenderPaths` / `getSitemapPaths` が
 * 担うため、この導出関数はモジュール内部に閉じる。
 */
function getContentRoutePaths(): {
	categories: string[];
	tags: string[];
	posts: string[];
} {
	const posts = sortPostsByDateDesc(getPublishedPosts());
	return {
		categories: categoriesWithPosts(posts),
		tags: [...new Set(posts.flatMap((post) => post.tags))],
		posts: posts.map((post) => post.slug),
	};
}

/**
 * `react-router.config.ts` の `prerender()` に、動的コンテンツと `/404` のパスを
 * 供給する。末尾スラッシュなし。
 *
 * 静的ルート(`/` `/rss.xml` `/sitemap.xml`)はここには含めない。これらは
 * `routes.ts` の定義そのものなので、`prerender()` 側が `getStaticPaths()` から
 * 導出する。`/404` は `*` splat マッチにしか現れず `getStaticPaths()` に載らない
 * ため、動的コンテンツと合わせてこの関数で補う。
 */
export function getPrerenderPaths(): string[] {
	const { categories, tags, posts } = getContentRoutePaths();
	return [
		"/404",
		...categories.map((category) => `/categories/${category}`),
		...tags.map((tag) => `/tags/${tag}`),
		...posts.map((slug) => `/posts/${slug}`),
	];
}

/**
 * `feed.ts` の `buildSitemap()` が `<loc>` に並べるパス一覧。
 * 末尾スラッシュ付き。`/404` は含めない。
 */
export function getSitemapPaths(): string[] {
	const { categories, tags, posts } = getContentRoutePaths();
	return [
		"/",
		...categories.map((category) => `/categories/${category}/`),
		...tags.map((tag) => `/tags/${tag}/`),
		...posts.map((slug) => `/posts/${slug}/`),
	];
}
