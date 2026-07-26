// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: `https://${process.env.BLOG_DOMAIN_NAME ?? "blog.example.com"}`,
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
