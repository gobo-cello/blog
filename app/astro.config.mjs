// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";

// https://astro.build/config
export default defineConfig({
	site: `https://${process.env.BLOG_DOMAIN_NAME ?? "blog.example.com"}`,
	integrations: [
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
