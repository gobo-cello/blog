import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types";
import type { ComponentType } from "react";
import { data, Link } from "react-router";
import CategoryBadge from "../components/CategoryBadge";
import TableOfContents from "../components/TableOfContents";
import Title from "../components/Title";
import { getPublishedPostBySlug } from "../content/posts";
import { plainTitle } from "../lib/title";
import { mdxComponents } from "../mdx/components";
import type { Route } from "./+types/post";

interface PostModule {
	default: ComponentType<MDXProps>;
	tableOfContents: Toc;
}

/**
 * 記事本文(MDX を React コンポーネントへコンパイルしたもの)は route モジュール
 * である本ファイルの module scope で解決する。全記事を eager で post ルートの
 * chunk に同梱する(記事数が少なく、遅延ロードの分割境界を増やすより 1 chunk に
 * まとめたほうが取り回しが良いため)。
 *
 * 次のいずれかが観測できるようになったら分割の合図とみなし、非 eager glob +
 * `React.lazy` か各 `.mdx` の個別 route 化で、ルート単位のコード分割へ移す。
 *   - post ルートの chunk が gzip で体感できる規模(数十 kB〜)になった
 *   - 記事数が数十件規模になった
 */
const postModules = import.meta.glob<PostModule>(
	"../content/posts/*/index.mdx",
	{ eager: true },
);

/**
 * slug から記事モジュールを O(1) で引くための索引を module scope で一度だけ構築する。
 * 以前は loader とコンポーネントで glob エントリを毎回線形走査していた(1 描画で 2 回)。
 *
 * key は glob パス `../content/posts/<slug>/index.mdx` の末尾から 2 番目のセグメント。
 * glob パターンが必ずディレクトリ名を 1 階層挟むため `at(-2)` が undefined になること
 * はないが、`noUncheckedIndexedAccess` 下では型に現れるので取り出せた場合だけ採用する。
 */
const postModuleBySlug: Record<string, PostModule> = Object.fromEntries(
	Object.entries(postModules).flatMap(([path, module]) => {
		const slug = path.split("/").at(-2);
		return slug ? [[slug, module] as const] : [];
	}),
);

export function loader({ params }: Route.LoaderArgs) {
	const post = getPublishedPostBySlug(params.slug);
	if (!post || !postModuleBySlug[params.slug]) {
		throw data(null, { status: 404 });
	}
	return { post };
}

export const handle = { wide: true };

export const meta: Route.MetaFunction = ({ loaderData }) => [
	{
		title: loaderData
			? plainTitle(loaderData.post.title)
			: "記事が見つかりません",
	},
];

export default function PostPage({ loaderData }: Route.ComponentProps) {
	const { post } = loaderData;
	const module = postModuleBySlug[post.slug];
	if (!module) {
		return null;
	}
	const { default: Content, tableOfContents } = module;

	return (
		<div className="lg:grid lg:grid-cols-[42rem_16rem] lg:items-start lg:gap-8">
			<article className="min-w-0">
				<h1 className="text-3xl font-bold">
					<Title title={post.title} />
				</h1>
				<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
					<p>{post.date.toISOString().slice(0, 10)}</p>
					<span aria-hidden="true">·</span>
					<CategoryBadge category={post.category} />
					{post.tags.length > 0 && (
						<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
							{post.tags.map((tag) => (
								<li key={tag}>
									<Link
										to={`/tags/${tag}`}
										prefetch="intent"
										className="rounded-full border border-border px-3 py-1 text-sm text-muted no-underline hover:border-accent hover:text-accent"
									>
										#{tag}
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className="prose mt-8 max-w-none prose-h2:border-b prose-h2:border-border prose-h2:pb-2">
					<Content components={mdxComponents} />
				</div>
			</article>
			<TableOfContents toc={tableOfContents} />
		</div>
	);
}
