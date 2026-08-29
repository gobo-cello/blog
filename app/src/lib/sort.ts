import type { Post } from "../content/schema";

/**
 * 記事一覧を日付降順に並び替える。トップページ・カテゴリ別一覧・タグ別一覧で
 * 表示順を揃えるために共通化している。
 */
export function sortPostsByDateDesc(posts: Post[]): Post[] {
	return [...posts].sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
	);
}
