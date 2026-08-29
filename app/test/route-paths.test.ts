import { describe, expect, it } from "vitest";
import { getPrerenderPaths, getSitemapPaths } from "../src/content/route-paths";

const stripTrailingSlash = (path: string): string =>
	path === "/" ? path : path.replace(/\/$/, "");

describe("getPrerenderPaths", () => {
	const paths = getPrerenderPaths();

	it("トップページとエラーページを含む", () => {
		expect(paths).toContain("/");
		expect(paths).toContain("/404");
	});

	it("トップページ以外は末尾スラッシュを付けない", () => {
		const withTrailingSlash = paths.filter(
			(path) => path !== "/" && path.endsWith("/"),
		);
		expect(withTrailingSlash).toEqual([]);
	});
});

describe("getSitemapPaths", () => {
	const paths = getSitemapPaths();

	it("すべてのパスを末尾スラッシュ付きの正規 URL で並べる", () => {
		expect(paths).toContain("/");
		expect(paths.every((path) => path.endsWith("/"))).toBe(true);
	});

	it("エラーページを含めない", () => {
		expect(paths).not.toContain("/404");
		expect(paths).not.toContain("/404/");
	});
});

describe("prerender と sitemap の対象", () => {
	it("エラーページを除けば同一のパス集合を指す", () => {
		const prerender = new Set(
			getPrerenderPaths().filter((path) => path !== "/404"),
		);
		const sitemap = new Set(getSitemapPaths().map(stripTrailingSlash));
		expect(sitemap).toEqual(prerender);
	});
});
