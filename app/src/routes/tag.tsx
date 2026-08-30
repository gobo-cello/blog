import { data, Link } from "react-router";
import Title from "../components/Title";
import { getPublishedPosts } from "../content/posts";
import { sortPostsByDateDesc } from "../lib/sort";
import type { Route } from "./+types/tag";

export function loader({ params }: Route.LoaderArgs) {
	const posts = getPublishedPosts();
	const { tag } = params;
	const presentTags: string[] = [
		...new Set(posts.flatMap((post) => post.tags)),
	];
	if (!presentTags.includes(tag)) {
		throw data(null, { status: 404 });
	}
	return {
		tag,
		posts: sortPostsByDateDesc(posts.filter((post) => post.tags.includes(tag))),
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
						<Link
							to={`/posts/${post.slug}`}
							prefetch="intent"
							className="text-foreground no-underline hover:text-accent"
						>
							<Title title={post.title} />
						</Link>
					</li>
				))}
			</ul>
		</>
	);
}
