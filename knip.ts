import type { KnipConfig } from "knip";

const config: KnipConfig = {
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {},
		app: {
			project: [
				"**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts,astro,css}!",
				"!scripts/check-unused-images.ts!",
			],
			ignoreDependencies: [
				"@astrojs/sitemap!",
				"@tailwindcss/vite!",
				"zod!",
				"astro-mermaid!",
				"mermaid!",
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
