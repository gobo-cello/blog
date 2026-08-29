import { CATEGORIES, type Category, type Post } from "../content/schema";

/**
 * カテゴリタブの表示順は CATEGORIES の宣言順を正とし、
 * 記事が1件も存在しないカテゴリはリンク先が存在しないため除外する。
 */
export function categoriesWithPosts(posts: Post[]): Category[] {
	const present = new Set(posts.map((post) => post.data.category));
	return CATEGORIES.filter((category) => present.has(category));
}
