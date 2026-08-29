import CategoryTabs from "../components/CategoryTabs";
import PostList from "../components/PostList";
import { getPublishedPosts } from "../content/posts";
import { categoriesWithPosts } from "../lib/categories";
import { sortPostsByDateDesc } from "../lib/sort";
import type { Route } from "./+types/home";

export function loader() {
	const posts = sortPostsByDateDesc(getPublishedPosts());
	return { posts, categories: categoriesWithPosts(posts) };
}

export const meta: Route.MetaFunction = () => [
	{ title: "ごぼうのブログ" },
	{ name: "description", content: "ごぼうのブログです。" },
];

export default function Home({ loaderData }: Route.ComponentProps) {
	const { posts, categories } = loaderData;
	return (
		<>
			<h1 className="text-2xl font-bold">最新の記事</h1>
			<CategoryTabs categories={categories} active={null} />
			<PostList posts={posts} />
		</>
	);
}
