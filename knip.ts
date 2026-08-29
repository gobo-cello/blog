import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			// react-router.config.ts の buildEnd(RSS / sitemap 生成)から到達する。
			// knip の react-router プラグインは buildEnd の import までは追わない。
			entry: ["src/content/feed.ts!"],
			project: [
				"**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts,css}!",
				// CI 専用の未使用画像チェック。本番同梱物ではないため production では対象外。
				"!scripts/check-unused-images.ts!",
				// vite.config.ts から使う MDX ビルドプラグイン。実行時バンドルには含まれない。
				"!src/mdx/rehype-mermaid-fence.ts!",
			],
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
