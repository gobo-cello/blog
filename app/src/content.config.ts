import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

export const CATEGORIES = ["agile", "tech", "meta"] as const;
export type Category = (typeof CATEGORIES)[number];
const TAGS = ["AWS", "React"] as const;

const posts = defineCollection({
	loader: glob({ pattern: "**/index.md", base: "./src/content/posts" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			category: z.enum(CATEGORIES),
			tags: z.array(z.enum(TAGS)).default([]),
			cover: image().optional(),
			draft: z.boolean().default(false),
		}),
});

export const collections = { posts };
