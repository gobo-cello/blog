import { data } from "react-router";
import { getPublishedPosts } from "../content/posts";
import { sortPostsByDateDesc } from "../lib/sort";
import { renderTitleHtml } from "../lib/title";
import type { Route } from "./+types/tag";

export function loader({ params }: Route.LoaderArgs) {
	const posts = getPublishedPosts();
	const { tag } = params;
	const presentTags: string[] = [
		...new Set(posts.flatMap((post) => post.data.tags)),
	];
	if (!presentTags.includes(tag)) {
		throw data(null, { status: 404 });
	}
	return {
		tag,
		posts: sortPostsByDateDesc(
			posts.filter((post) =>
				(post.data.tags as readonly string[]).includes(tag),
			),
		),
	};
}

export const meta: Route.MetaFunction = ({ params }) => [
	{ title: `タグ: ${params.tag}` },
	{ name: "description", content: `${params.tag}タグの記事一覧です。` },
];

export default function TagPage({ loaderData }: Route.ComponentProps) {
	const { tag, posts } = loaderData;
	return (
		<>
			<h1 className="text-2xl font-bold">#{tag}</h1>
			<ul className="mt-4 list-none divide-y divide-border p-0">
				{posts.map((post) => (
					<li key={post.slug} className="py-3 first:pt-0">
						<a
							href={`/posts/${post.slug}/`}
							className="text-foreground no-underline hover:text-accent"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: renderTitleHtml は HTML エスケープ済みの文字列を返す
							dangerouslySetInnerHTML={{
								__html: renderTitleHtml(post.data.title),
							}}
						/>
					</li>
				))}
			</ul>
		</>
	);
}
