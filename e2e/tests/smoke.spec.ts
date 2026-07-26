import { resolve4 } from "node:dns/promises";
import { expect, test } from "@playwright/test";

function extractPaths(sitemapXml: string): string[] {
	return [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		([, url]) => new URL(url as string).pathname,
	);
}

test("DNSが解決できる", async ({ baseURL }) => {
	const { hostname } = new URL(baseURL ?? "");
	const addresses = await resolve4(hostname);
	expect(addresses.length).toBeGreaterThan(0);
});

test("トップページが表示される", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);
});

test("sitemapに掲載された全ページが表示される", async ({ page, request }) => {
	// sitemapのURLはbuild時に固定されたsite("https://blog.example.com")の
	// ホスト名を含む(sandbox/productionでapp/distを共用しているため)。
	// ホスト名は無視し、pathだけをテスト対象のbase URLに付け替えて確認する。
	const indexXml = await (await request.get("/sitemap-index.xml")).text();
	const shardPaths = extractPaths(indexXml);
	expect(shardPaths.length).toBeGreaterThan(0);

	const pagePaths: string[] = [];
	for (const shardPath of shardPaths) {
		const shardXml = await (await request.get(shardPath)).text();
		pagePaths.push(...extractPaths(shardXml));
	}
	expect(pagePaths.length).toBeGreaterThan(0);

	for (const path of pagePaths) {
		await test.step(`GET ${path}`, async () => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
		});
	}
});

test("存在しないパスは404を返す", async ({ page }) => {
	const response = await page.goto("/e2e-test-nonexistent-path/");
	expect(response?.status()).toBe(404);
});
