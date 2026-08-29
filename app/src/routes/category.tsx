import { data } from "react-router";
import CategoryTabs from "../components/CategoryTabs";
import PostList from "../components/PostList";
import { getPublishedPosts } from "../content/posts";
import type { Category } from "../content/schema";
import { categoriesWithPosts } from "../lib/categories";
import { sortPostsByDateDesc } from "../lib/sort";
import type { Route } from "./+types/category";

export function loader({ params }: Route.LoaderArgs) {
	const posts = getPublishedPosts();
	const categories = categoriesWithPosts(posts);
	const category = params.category as Category;
	if (!categories.includes(category)) {
		throw data(null, { status: 404 });
	}
	return {
		category,
		categories,
		posts: sortPostsByDateDesc(
			posts.filter((post) => post.data.category === category),
		),
	};
}

export const meta: Route.MetaFunction = ({ params }) => [
	{ title: `カテゴリ: ${params.category}` },
	{
		name: "description",
		content: `${params.category}カテゴリの記事一覧です。`,
	},
];

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
	const { category, categories, posts } = loaderData;
	return (
		<>
			<h1 className="text-2xl font-bold">最新の記事</h1>
			<CategoryTabs categories={categories} active={category} />
			<PostList posts={posts} />
		</>
	);
}
