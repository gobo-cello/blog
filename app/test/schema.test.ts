import { describe, expect, it } from "vitest";
import { postFrontmatterSchema } from "../src/content/schema";

describe("postFrontmatterSchema", () => {
	it("必須項目だけの frontmatter に既定値を補う", () => {
		const parsed = postFrontmatterSchema.parse({
			title: "タイトル",
			date: "2026-08-17",
			category: "tech",
		});

		expect(parsed.tags).toEqual([]);
		expect(parsed.draft).toBe(false);
		expect(parsed.date).toBeInstanceOf(Date);
		expect(parsed.date.toISOString().slice(0, 10)).toBe("2026-08-17");
	});

	it("既知のカテゴリ・タグを受け入れる", () => {
		const parsed = postFrontmatterSchema.parse({
			title: "タイトル",
			date: "2026-08-17",
			category: "meta",
			tags: ["React"],
			draft: true,
		});

		expect(parsed.category).toBe("meta");
		expect(parsed.tags).toEqual(["React"]);
		expect(parsed.draft).toBe(true);
	});

	it("未知のカテゴリを拒否する", () => {
		expect(() =>
			postFrontmatterSchema.parse({
				title: "タイトル",
				date: "2026-08-17",
				category: "unknown",
			}),
		).toThrow();
	});

	it("未知のタグを拒否する", () => {
		expect(() =>
			postFrontmatterSchema.parse({
				title: "タイトル",
				date: "2026-08-17",
				category: "tech",
				tags: ["Go"],
			}),
		).toThrow();
	});
});
