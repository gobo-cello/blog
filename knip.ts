import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			project: [
				"**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts,astro,css}!",
				"!scripts/check-unused-images.ts!",
				"!src/lib/code-block-title.ts!",
			],
			ignoreDependencies: [
				"@astrojs/sitemap!",
				"@tailwindcss/vite!",
				"zod!",
				"astro-mermaid!",
				"mermaid!",
				"@expressive-code/core!",
				"astro-expressive-code!",
				"vite!",
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
