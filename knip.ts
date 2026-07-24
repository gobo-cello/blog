import type { KnipConfig } from "knip";

const config: KnipConfig = {
	workspaces: {
		".": {},
		app: {
			// tsx プラグインが check:images スクリプトを default モードの entry として
			// 自動検出するが、--production では対象外になり check-unused-images.ts が
			// 「未使用ファイル」と誤検知される。明示的に entry として指定して回避する。
			// knip の Configuration hints は「redundant」と警告するが、指定を外すと
			// --production の誤検知が復活するため意図的な指定として残す。
			entry: ["scripts/check-unused-images.ts"],
			// astro.config.mjs (@astrojs/sitemap) と src/content.config.ts (zod) で
			// 使用しているが、knip の --production は設定ファイル・content collections
			// 定義を出荷コードの対象外として扱うため未使用扱いになる誤検知。
			ignoreDependencies: ["@astrojs/sitemap", "zod"],
		},
		infra: {
			// cdk.json の "app" から tsx 経由で実行される CDK エントリポイント。
			// package.json の scripts 経由ではないため tsx プラグインの自動検出対象外 → 明示する。
			entry: ["bin/infra.ts!"],
			project: ["bin/**/*.ts!", "lib/**/*.ts!", "test/**/*.ts"],
			// tsx は cdk.json の "app" フィールドから呼ばれており、package.json の
			// scripts 経由ではないため tsx プラグインが使用を検出できない。
			ignoreDependencies: ["tsx"],
		},
	},
};

export default config;
