import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MDXProps } from "mdx/types";
import type { ComponentType } from "react";
import { data } from "react-router";
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
 * である本ファイルの module scope で解決する。全記事を post ルートの chunk に
 * 同梱(eager)する。記事数が増えて肥大化したら、各 .mdx を個別 route にする
 * (React Router の route 単位コード分割へ載せ替える)ことを検討する。
 */
const postModules = import.meta.glob<PostModule>(
	"../content/posts/*/index.mdx",
	{ eager: true },
);

function moduleForSlug(slug: string): PostModule | undefined {
	for (const [path, module] of Object.entries(postModules)) {
		if (path.split("/").at(-2) === slug) {
			return module;
		}
	}
	return undefined;
}

export function loader({ params }: Route.LoaderArgs) {
	const post = getPublishedPostBySlug(params.slug);
	if (!post || !moduleForSlug(params.slug)) {
		throw data(null, { status: 404 });
	}
	return { post };
}

export const handle = { wide: true };

export const meta: Route.MetaFunction = ({ loaderData }) => [
	{
		title: loaderData
			? plainTitle(loaderData.post.data.title)
			: "記事が見つかりません",
	},
];

export default function PostPage({ loaderData }: Route.ComponentProps) {
	const { post } = loaderData;
	const module = moduleForSlug(post.slug);
	if (!module) {
		return null;
	}
	const { default: Content, tableOfContents } = module;

	return (
		<div className="lg:grid lg:grid-cols-[42rem_16rem] lg:items-start lg:gap-8">
			<article className="min-w-0">
				<h1 className="text-3xl font-bold">
					<Title title={post.data.title} />
				</h1>
				<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
					<p>{post.data.date.toISOString().slice(0, 10)}</p>
					<span aria-hidden="true">·</span>
					<CategoryBadge category={post.data.category} />
					{post.data.tags.length > 0 && (
						<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
							{post.data.tags.map((tag) => (
								<li key={tag}>
									<a
										href={`/tags/${tag}/`}
										className="rounded-full border border-border px-3 py-1 text-sm text-muted no-underline hover:border-accent hover:text-accent"
									>
										#{tag}
									</a>
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
