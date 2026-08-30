import { describe, expect, it } from "vitest";
import {
	CATEGORIES,
	isCategory,
	postFrontmatterSchema,
} from "../src/content/schema";

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

	it("既知のカテゴリと任意のタグ文字列を受け入れる", () => {
		const parsed = postFrontmatterSchema.parse({
			title: "タイトル",
			date: "2026-08-17",
			category: "meta",
			tags: ["Go", "設計"],
			draft: true,
		});

		expect(parsed.category).toBe("meta");
		expect(parsed.tags).toEqual(["Go", "設計"]);
		expect(parsed.draft).toBe(true);
	});

	it("タグは enum ではなく任意の非空文字列を語彙として受け入れる", () => {
		const parsed = postFrontmatterSchema.parse({
			title: "タイトル",
			date: "2026-08-17",
			category: "tech",
			tags: ["まったく新しいタグ", "another-new-tag"],
		});

		expect(parsed.tags).toEqual(["まったく新しいタグ", "another-new-tag"]);
	});

	it("前後の空白を除去したうえでタグを保持する", () => {
		const parsed = postFrontmatterSchema.parse({
			title: "タイトル",
			date: "2026-08-17",
			category: "tech",
			tags: ["  React  "],
		});

		expect(parsed.tags).toEqual(["React"]);
	});

	it("空文字・空白のみのタグを拒否する", () => {
		expect(() =>
			postFrontmatterSchema.parse({
				title: "タイトル",
				date: "2026-08-17",
				category: "tech",
				tags: [""],
			}),
		).toThrow();

		expect(() =>
			postFrontmatterSchema.parse({
				title: "タイトル",
				date: "2026-08-17",
				category: "tech",
				tags: ["   "],
			}),
		).toThrow();
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
});

describe("isCategory", () => {
	it.each([...CATEGORIES])(
		"既知のカテゴリ名 %s を Category と判定する",
		(value) => {
			expect(isCategory(value)).toBe(true);
		},
	);

	it("未知のカテゴリ名を Category と判定しない", () => {
		expect(isCategory("unknown")).toBe(false);
	});

	it("空文字を Category と判定しない", () => {
		expect(isCategory("")).toBe(false);
	});
});
