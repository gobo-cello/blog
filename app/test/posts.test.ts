import { describe, expect, it } from "vitest";
import {
	getPublishedPostBySlug,
	getPublishedPosts,
} from "../src/content/posts";

describe("getPublishedPosts", () => {
	const posts = getPublishedPosts();

	it("公開記事を読み込む", () => {
		expect(posts.length).toBeGreaterThan(0);
	});

	it("下書きを含めない", () => {
		expect(posts.every((post) => post.data.draft === false)).toBe(true);
	});

	it("slug が記事ディレクトリ名で一意になる", () => {
		const slugs = posts.map((post) => post.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(slugs).not.toContain(".template");
	});
});

describe("getPublishedPostBySlug", () => {
	it("存在する slug の記事を返す", () => {
		expect(getPublishedPostBySlug("first-post")?.data.title).toBeTruthy();
	});

	it("存在しない slug には undefined を返す", () => {
		expect(getPublishedPostBySlug("does-not-exist")).toBeUndefined();
	});
});
