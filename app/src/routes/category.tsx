import { data } from "react-router";
import CategoryTabs from "../components/CategoryTabs";
import PostList from "../components/PostList";
import { getPublishedPosts } from "../content/posts";
import { isCategory } from "../content/schema";
import { categoriesWithPosts } from "../lib/categories";
import { sortPostsByDateDesc } from "../lib/sort";
import type { Route } from "./+types/category";

export function loader({ params }: Route.LoaderArgs) {
	const { category } = params;
	// 未知のカテゴリ名は 404。ここで型ガードを通すことで以降 `category` は `Category` に narrowing される。
	if (!isCategory(category)) {
		throw data(null, { status: 404 });
	}

	const posts = getPublishedPosts();
	const categories = categoriesWithPosts(posts);
	// 既知のカテゴリ名でも公開記事が 1 件も無ければリンク先が存在しないため 404。
	if (!categories.includes(category)) {
		throw data(null, { status: 404 });
	}

	return {
		category,
		categories,
		posts: sortPostsByDateDesc(
			posts.filter((post) => post.category === category),
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
			<h1 className="text-2xl font-bold">{category}</h1>
			<CategoryTabs categories={categories} active={category} />
			<PostList posts={posts} />
		</>
	);
}
