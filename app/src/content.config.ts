import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const blog = defineCollection({
	loader: glob({ pattern: "**/index.md", base: "./src/content/blog" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			category: z.string(),
			tags: z.array(z.string()).default([]),
			cover: image().optional(),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
