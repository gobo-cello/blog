import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			// tsx プラグインが check:images スクリプトを default モードの entry として
			// 自動検出するが、--production では対象外になり check-unused-images.ts が
			// 「未使用ファイル」と誤検知される。明示的に entry として指定して回避する。
			// knip の Configuration hints は「redundant」と警告するが、指定を外すと
			// --production の誤検知が復活するため意図的な指定として残す。
			entry: ["scripts/check-unused-images.ts"],
			// astro.config.mjs (@astrojs/sitemap, @tailwindcss/vite, astro-mermaid) と
			// src/content.config.ts (zod) で使用しているが、knip の --production は
			// 設定ファイル・content collections 定義を出荷コードの対象外として扱うため
			// 未使用扱いになる誤検知。
			// mermaid は astro-mermaid が生成するクライアントスクリプトから
			// import("mermaid") で動的に読み込まれる実行時依存で、ソースコード上に
			// 直接の import が現れないため同様に誤検知される。
			ignoreDependencies: [
				"@astrojs/sitemap",
				"@tailwindcss/vite",
				"zod",
				"astro-mermaid",
				"mermaid",
			],
		},
		infra: {
			// tsx は cdk.json の "app" から呼ばれており package.json の scripts 経由ではないため、
			// entry・tsx依存ともに knip のプラグイン自動検出対象外となり、明示する。
			entry: ["bin/infra.ts!"],
			project: ["bin/**/*.ts!", "lib/**/*.ts!", "test/**/*.ts"],
			ignoreDependencies: ["tsx"],
		},
		e2e: {},
	},
};

export default config;
