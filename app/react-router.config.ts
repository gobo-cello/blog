import { join } from "node:path";
import type { Config } from "@react-router/dev/config";
import { writeFeedFiles } from "./src/content/feed";
import { getPublishedPosts } from "./src/content/posts";
import { CATEGORIES } from "./src/content/schema";

export default {
	appDirectory: "src",
	buildDirectory: "dist",
	// ランタイムサーバーを持たない静的サイトとして S3+CloudFront で配信するため、
	// SPA mode(ssr:false)で全ページをビルド時に prerender する
	// (infra/lib/constructs/static-site-hosting.ts 参照)。
	ssr: false,
	async prerender() {
		const posts = getPublishedPosts();
		const categories = CATEGORIES.filter((category) =>
			posts.some((post) => post.data.category === category),
		);
		const tags = [...new Set(posts.flatMap((post) => post.data.tags))];

		// prerender のパスは末尾スラッシュなしで指定する(出力はトップページを除き
		// `<path>/index.html`)。アプリ内リンクと sitemap は従来どおり末尾スラッシュ付き。
		return [
			"/",
			"/404",
			...categories.map((category) => `/categories/${category}`),
			...tags.map((tag) => `/tags/${tag}`),
			...posts.map((post) => `/posts/${post.slug}`),
		];
	},
	buildEnd({ reactRouterConfig }) {
		// RSS / sitemap は integration を持たないため、prerender 済みの
		// クライアント出力ディレクトリへ直接書き出す。
		writeFeedFiles(join(reactRouterConfig.buildDirectory, "client"));
	},
} satisfies Config;
