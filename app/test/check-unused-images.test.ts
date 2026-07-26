import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findUnusedImages } from "../scripts/check-unused-images";

describe("findUnusedImages", () => {
	let contentDir: string;

	beforeEach(() => {
		contentDir = mkdtempSync(join(tmpdir(), "blog-content-"));
	});

	afterEach(() => {
		rmSync(contentDir, { recursive: true, force: true });
	});

	function createPost(
		slug: string,
		markdownContent: string,
		imageFileNames: string[],
	): void {
		const postDir = join(contentDir, slug);
		mkdirSync(postDir);
		writeFileSync(join(postDir, "index.md"), markdownContent);
		for (const imageFileName of imageFileNames) {
			writeFileSync(join(postDir, imageFileName), "");
		}
	}

	describe("記事ディレクトリにindex.mdが存在する場合", () => {
		it("記事から参照されている画像のパスは返さない", () => {
			createPost(
				"hello-world",
				'---\ncover: "./cover.png"\n---\n\n![alt](./inline.png)\n',
				["cover.png", "inline.png"],
			);

			expect(findUnusedImages(contentDir)).toEqual([]);
		});

		it("記事から参照されていない画像のパスを返す", () => {
			createPost("hello-world", "---\ntitle: hello\n---\n\n本文\n", [
				"unused.png",
			]);

			const unusedImagePaths = findUnusedImages(contentDir);

			expect(unusedImagePaths).toHaveLength(1);
			expect(unusedImagePaths[0]).toContain("unused.png");
		});
	});

	describe("記事ディレクトリにindex.mdが存在しない場合", () => {
		it("ディレクトリ内の画像パスは返さない", () => {
			const dir = join(contentDir, "not-a-post");
			mkdirSync(dir);
			writeFileSync(join(dir, "stray.png"), "");

			expect(findUnusedImages(contentDir)).toEqual([]);
		});
	});
});
