import { describe, expect, it } from "vitest";
import { getPrerenderPaths, getSitemapPaths } from "../src/content/route-paths";

describe("getPrerenderPaths", () => {
	const paths = getPrerenderPaths();

	it("エラーページを含む", () => {
		expect(paths).toContain("/404");
	});

	it("静的ルートは含めない(`routes.ts` から getStaticPaths で導出するため)", () => {
		expect(paths).not.toContain("/");
		expect(paths).not.toContain("/rss.xml");
		expect(paths).not.toContain("/sitemap.xml");
	});

	it("動的コンテンツ(記事・カテゴリ・タグ)のパスを含む", () => {
		expect(paths.some((path) => path.startsWith("/posts/"))).toBe(true);
		expect(paths.some((path) => path.startsWith("/categories/"))).toBe(true);
		expect(paths.some((path) => path.startsWith("/tags/"))).toBe(true);
	});

	it("末尾スラッシュを付けない", () => {
		const withTrailingSlash = paths.filter((path) => path.endsWith("/"));
		expect(withTrailingSlash).toEqual([]);
	});
});

describe("getSitemapPaths", () => {
	const paths = getSitemapPaths();

	it("トップページを含む", () => {
		expect(paths).toContain("/");
	});

	it("トップページ以外に末尾スラッシュを付けない", () => {
		const withTrailingSlash = paths.filter(
			(path) => path !== "/" && path.endsWith("/"),
		);
		expect(withTrailingSlash).toEqual([]);
	});

	it("エラーページを含めない", () => {
		expect(paths).not.toContain("/404");
	});

	it("自身と RSS フィードを列挙しない", () => {
		expect(paths).not.toContain("/rss.xml");
		expect(paths).not.toContain("/sitemap.xml");
	});
});

describe("prerender と sitemap の対象", () => {
	it("エラーページとトップページを除けば同一の動的コンテンツ集合を指す", () => {
		// `/404` は prerender 専用、`/` は sitemap 側にのみ残る(prerender では
		// `getStaticPaths()` が供給する)。それらを除いた動的コンテンツ
		// (記事・カテゴリ・タグ)は、どちらも同じ末尾スラッシュなしの形で同一集合。
		const prerenderContent = new Set(
			getPrerenderPaths().filter((path) => path !== "/404"),
		);
		const sitemapContent = new Set(
			getSitemapPaths().filter((path) => path !== "/"),
		);
		expect(sitemapContent).toEqual(prerenderContent);
	});
});
