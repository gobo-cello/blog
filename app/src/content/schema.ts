import { z } from "zod";

export const CATEGORIES = ["agile", "tech", "meta"] as const;
export type Category = (typeof CATEGORIES)[number];

// frontmatter は `postFrontmatterSchema` で検証されるが、ルートパラメータ(`/categories/:category`)は
// 素の `string` で渡ってくる。`as Category` で嘘をつかず、境界でこの型ガードを通して narrowing する。
export function isCategory(value: string): value is Category {
	return (CATEGORIES as readonly string[]).includes(value);
}

// category は閉じた語彙(`CATEGORIES`)、tag は open(記事が実際に使ったものがそのまま語彙になる)。
// tag を閉じた enum にすると、タグページ・sitemap・prerender が posts から導出しているタグ集合と
// frontmatter 側の enum の二重管理になる。タイポは orphan なタグページを生むリスクがあるが、
// 一覧・sitemap・prerender は元々 posts からタグを導出しているため、二重管理を避けて open に統一した。
// 空文字・空白のみのタグは near-duplicate なタグページを生むため、`trim().min(1)` で弾く。
export const postFrontmatterSchema = z.object({
	title: z.string(),
	date: z.coerce.date(),
	category: z.enum(CATEGORIES),
	tags: z.array(z.string().trim().min(1)).default([]),
	draft: z.boolean().default(false),
});

type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface Post extends PostFrontmatter {
	slug: string;
}
