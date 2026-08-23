import type { CollectionEntry } from "astro:content";

/**
 * 記事一覧を日付降順に並び替える。トップページ・カテゴリ別一覧・タグ別一覧で
 * 表示順を揃えるために共通化している。
 */
export function sortPostsByDateDesc(
	posts: CollectionEntry<"posts">[],
): CollectionEntry<"posts">[] {
	return [...posts].sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
	);
}
