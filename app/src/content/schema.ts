import { z } from "zod";

export const CATEGORIES = ["agile", "tech", "meta"] as const;
export type Category = (typeof CATEGORIES)[number];

const TAGS = ["AWS", "React"] as const;

export const postFrontmatterSchema = z.object({
	title: z.string(),
	date: z.coerce.date(),
	category: z.enum(CATEGORIES),
	tags: z.array(z.enum(TAGS)).default([]),
	draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface Post {
	slug: string;
	data: PostFrontmatter;
}
