import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			// route-paths.ts は react-router.config.ts の prerender() からのみ
			// 到達する。knip の react-router プラグインはこの hook の import を
			// 追わないため、直接 entry として明示する。feed.ts は resource route
			// (routes/{rss,sitemap}.xml.ts)経由で routes.ts から辿れるため不要。
			entry: ["src/content/route-paths.ts!"],
			project: [
				"**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts,css}!",
				// CI 専用の未使用画像チェック。本番同梱物ではないため production では対象外。
				"!scripts/check-unused-images.ts!",
				// vite.config.ts から使う MDX ビルドプラグイン。実行時バンドルには含まれない。
				"!src/mdx/rehype-mermaid-fence.ts!",
			],
			// ルートモジュールの `./+types/*` は `react-router typegen` が
			// .react-router/types/ へ生成する型で、typegen 前(CI の knip ジョブ)は
			// 解決できない。knip の react-router プラグインもこの生成物は扱わない。
			ignoreUnresolved: [/^\.\/\+types\//],
		},
		infra: {
			entry: ["bin/infra.ts!"],
			project: ["bin/**/*.ts!", "lib/**/*.ts!", "test/**/*.ts"],
			ignoreDependencies: ["tsx"],
		},
		e2e: {},
	},
};

export default config;
