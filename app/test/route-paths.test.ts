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

	it("RSS / sitemap の resource route をファイルパスとして含む", () => {
		expect(paths).toContain("/rss.xml");
		expect(paths).toContain("/sitemap.xml");
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

	it("自身と RSS フィードを列挙しない", () => {
		expect(paths).not.toContain("/rss.xml");
		expect(paths).not.toContain("/sitemap.xml");
	});
});

describe("prerender と sitemap の対象", () => {
	it("エラーページと RSS / sitemap ファイルを除けば同一のパス集合を指す", () => {
		const nonContentPaths = new Set(["/404", "/rss.xml", "/sitemap.xml"]);
		const prerender = new Set(
			getPrerenderPaths().filter((path) => !nonContentPaths.has(path)),
		);
		const sitemap = new Set(getSitemapPaths().map(stripTrailingSlash));
		expect(sitemap).toEqual(prerender);
	});
});
