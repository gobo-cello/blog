import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import withToc from "@stefanprobst/rehype-extract-toc";
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, loadEnv } from "vite";
import { rehypeMermaidFence } from "./src/mdx/rehype-mermaid-fence.ts";

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

export default defineConfig({
	plugins: [
		// MDX プラグインは reactRouter() より前に置く必要がある。
		mdx({
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
			rehypePlugins: [
				rehypeSlug,
				// Mermaid フェンスはコードハイライトの前に <mermaid> へ退避する。
				rehypeMermaidFence,
				[rehypePrettyCode, { theme: "github-dark", keepBackground: true }],
				withToc,
				withTocExport,
			],
		}),
		tailwindcss(),
		reactRouter(),
	],
	define: {
		// クライアントバンドルは process.env を持たないため、ビルド時に
		// 静的な文字列へ置き換える(src/root.tsx 参照)。
		"process.env.APEX_DOMAIN_NAME": JSON.stringify(
			process.env.APEX_DOMAIN_NAME ?? "",
		),
	},
});
