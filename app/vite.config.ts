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
 * ローカル開発では `.env.local` を読み込む。ここで `process.env` へ橋渡しして
 * おくことで、Node のビルドプロセス内で `process.env` を読むサーバー側専用の
 * `src/config/site.ts`(prerender 時に RSS / sitemap の resource route loader
 * から呼ばれる)が `.env.local` の値を拾える。
 * クライアントバンドルへ露出させたい値は `VITE_` プレフィックス付きの環境変数と
 * し、ビルド対象コードから `import.meta.env` 経由で読む(Vite が自動で露出する)。
 * この橋渡しループはあくまでサーバー側 `src/config/site.ts` のためのもの。
 * CI で明示的に渡された環境変数を上書きしないよう、未設定のキーだけ補う。
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
});
