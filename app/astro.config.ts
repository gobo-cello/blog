import sitemap from "@astrojs/sitemap";
import { definePlugin } from "@expressive-code/core";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import mermaid from "astro-mermaid";
import { loadEnv } from "vite";
import { resolveCodeBlockTitle } from "./src/lib/code-block-title";
import { resolveSiteUrl } from "./src/lib/site-url";

/**
 * infra/ の `.env.local`(`cdk.json` の `--env-file-if-exists`)と同様に、
 * ローカル開発では `.env.local` を読み込む。CI で明示的に渡された環境変数を
 * 上書きしないよう、未設定のキーだけ補う。
 */
for (const [key, value] of Object.entries(
	loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), ""),
)) {
	process.env[key] ??= value;
}

const autoLanguageTitlePlugin = () =>
	definePlugin({
		name: "auto-language-title",
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				codeBlock.props.title = resolveCodeBlockTitle(
					codeBlock.props.title,
					codeBlock.language,
				);
			},
		},
	});

// https://astro.build/config
export default defineConfig({
	site: resolveSiteUrl(process.env.BLOG_DOMAIN_NAME),
	integrations: [
		expressiveCode({
			themes: ["github-light"],
			plugins: [autoLanguageTitlePlugin()],
		}),
		mermaid({
			theme: "base",
			mermaidConfig: {
				themeVariables: {
					background: "#f7f6f3",
					primaryColor: "#efede8",
					primaryTextColor: "#2e2e2b",
					primaryBorderColor: "#a24e2c",
					lineColor: "#66645f",
					secondaryColor: "#ddd8cf",
					tertiaryColor: "#f7f6f3",
					textColor: "#2e2e2b",
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Yu Gothic", Meiryo, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
				},
			},
		}),
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
