import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { type Post, postFrontmatterSchema } from "./schema";

/**
 * 記事ディレクトリの走査は Node の `fs` で行い、`import.meta.glob` は使わない。
 * このモジュールは `react-router.config.ts` の `prerender()`(`route-paths.ts`
 * 経由)や Knip の設定読み込みなど、Vite 変換を経ない経路からも import される
 * ため、`import.meta.glob` を書くと解決できずに壊れる。MDX 本文(React コンポーネント)は
 * `routes/post.tsx` が `import.meta.glob` で取得し、ここでは frontmatter と slug だけ扱う。
 *
 * パスは `process.cwd()` 基準で解決する。ビルド後のこのモジュールは
 * `dist/server/` 配下へバンドルされ `import.meta.dirname` がソースの位置から
 * ずれるが、`react-router build` も `prerender` も `check:images` も常に
 * `app/` を作業ディレクトリとして実行される。
 */
const POSTS_DIR = join(process.cwd(), "src", "content", "posts");

function readPublishedPosts(): Post[] {
	const posts: Post[] = [];
	for (const entry of readdirSync(POSTS_DIR, { withFileTypes: true })) {
		// `.template` / `.obsidian` などのドット始まりと、複数階層下にある
		// `drafts/` は記事一覧に含めない(drafts は常に draft:true かつ git 管理外)。
		if (!entry.isDirectory() || entry.name.startsWith(".")) {
			continue;
		}

		let raw: string;
		try {
			raw = readFileSync(join(POSTS_DIR, entry.name, "index.mdx"), "utf-8");
		} catch {
			continue;
		}

		const { data } = matter(raw);
		const frontmatter = postFrontmatterSchema.parse(data);
		if (frontmatter.draft) {
			continue;
		}
		posts.push({ slug: entry.name, data: frontmatter });
	}
	return posts;
}

let cachedPosts: Post[] | undefined;

export function getPublishedPosts(): Post[] {
	cachedPosts ??= readPublishedPosts();
	return cachedPosts;
}

export function getPublishedPostBySlug(slug: string): Post | undefined {
	return getPublishedPosts().find((post) => post.slug === slug);
}
