import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			// react-router.config.ts の buildEnd()(feed.ts)と prerender()
			// (route-paths.ts)から到達する。knip の react-router プラグインは
			// これらの hook の import を追わないため、hook が参照するモジュールを
			// 直接 entry として明示する。route-paths.ts は sitemap 経由(feed.ts)
			// でも参照されるが、prerender 経路は production mode で追跡されないため
			// 個別に指定する。
			entry: ["src/content/feed.ts!", "src/content/route-paths.ts!"],
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
