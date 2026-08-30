import type { Config } from "@react-router/dev/config";
import { getPrerenderPaths } from "./src/content/route-paths";

export default {
	appDirectory: "src",
	buildDirectory: "dist",
	// ランタイムサーバーを持たない静的サイトとして S3+CloudFront で配信するため、
	// SPA mode(ssr:false)で全ページをビルド時に prerender する
	// (infra/lib/constructs/static-site-hosting.ts 参照)。
	ssr: false,
	async prerender({ getStaticPaths }) {
		// prerender 対象のパスは二系統に分かれる。
		// - 静的ルート(`/` `/rss.xml` `/sitemap.xml`)は `routes.ts` の定義そのもの
		//   なので、React Router が提供する `getStaticPaths` から導出する。これにより
		//   `routes.ts` に静的ルートを足したとき、prerender 側の一覧を手で追随させる
		//   必要がなくなる(二重管理の解消)。
		// - 動的コンテンツ(`/categories/*` `/tags/*` `/posts/*`)と `/404` は
		//   `routes.ts` からは列挙できない(前者は記事・カテゴリ・タグの集合、後者は
		//   `*` splat マッチ)ため、`src/content/route-paths.ts` で導出する。
		return [...getStaticPaths(), ...getPrerenderPaths()];
	},
} satisfies Config;
