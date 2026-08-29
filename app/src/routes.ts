import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("categories/:category", "routes/category.tsx"),
	route("posts/:slug", "routes/post.tsx"),
	route("tags/:tag", "routes/tag.tsx"),
	// default export を持たない resource route。prerender 時に loader が実行され、
	// 本文が `dist/client/{rss,sitemap}.xml` へ書き出される(`route-paths.ts` 参照)。
	// splat の前に置き、`/rss.xml` `/sitemap.xml` が 404 ルートへ吸われないようにする。
	route("rss.xml", "routes/rss.xml.ts"),
	route("sitemap.xml", "routes/sitemap.xml.ts"),
	route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
