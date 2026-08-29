import type { Config } from "@react-router/dev/config";
import { getPrerenderPaths } from "./src/content/route-paths";

export default {
	appDirectory: "src",
	buildDirectory: "dist",
	// ランタイムサーバーを持たない静的サイトとして S3+CloudFront で配信するため、
	// SPA mode(ssr:false)で全ページをビルド時に prerender する
	// (infra/lib/constructs/static-site-hosting.ts 参照)。
	ssr: false,
	async prerender() {
		// prerender と sitemap で対象パスの導出が二重管理にならないよう、
		// 一覧は `src/content/route-paths.ts` に集約している。RSS / sitemap も
		// resource route(`src/routes/{rss,sitemap}.xml.ts`)として prerender され、
		// その本文が `dist/client/{rss,sitemap}.xml` へ書き出される。
		return getPrerenderPaths();
	},
} satisfies Config;
