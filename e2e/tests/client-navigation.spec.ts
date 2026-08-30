import { expect, type Page, test } from "@playwright/test";

/**
 * クライアントサイド遷移(フルリロードを伴わないページ遷移)が起きたことを、
 * 遷移前に現在のドキュメントへ書き込んだ marker が遷移後も残っているかで判定する。
 * フルリロードなら新しいドキュメントに置き換わり marker は失われる。
 */
const MARKER_KEY = "__clientNavMarker";

async function markCurrentDocument(page: Page): Promise<void> {
	await page.evaluate((key) => {
		(globalThis as Record<string, unknown>)[key] = "alive";
	}, MARKER_KEY);
}

function readMarker(page: Page): Promise<unknown> {
	return page.evaluate(
		(key) => (globalThis as Record<string, unknown>)[key],
		MARKER_KEY,
	);
}

function scrollY(page: Page): Promise<number> {
	return page.evaluate(
		() => (globalThis as unknown as { scrollY: number }).scrollY,
	);
}

test("カテゴリタブをクリックすると、フルリロードせずに記事一覧が切り替わる", async ({
	page,
}) => {
	await page.goto("/");
	await markCurrentDocument(page);

	let fullLoads = 0;
	page.on("load", () => {
		fullLoads += 1;
	});

	const categoryNav = page.getByRole("navigation", { name: "カテゴリ" });
	const firstCategoryTab = categoryNav.getByRole("link").nth(1);
	const categoryName = (await firstCategoryTab.textContent())?.trim() ?? "";
	expect(categoryName).not.toBe("");

	await firstCategoryTab.click();

	await expect(page).toHaveURL(new RegExp(`/categories/${categoryName}$`));
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		categoryName,
	);
	await expect(
		categoryNav.getByRole("link", { name: categoryName }),
	).toHaveAttribute("aria-current", "page");

	expect(await readMarker(page)).toBe("alive");
	expect(fullLoads).toBe(0);
});

test("記事一覧から記事へ遷移し、ブラウザバックで一覧へ戻れる", async ({
	page,
}) => {
	await page.goto("/");
	await markCurrentDocument(page);

	const firstPostLink = page.locator("main li a").first();
	const href = await firstPostLink.getAttribute("href");
	expect(href).toMatch(/^\/posts\//);

	await firstPostLink.click();
	await expect(page).toHaveURL(new RegExp(`${href}$`));
	await expect(page.getByRole("article")).toBeVisible();
	expect(await readMarker(page)).toBe("alive");

	await page.goBack();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"最新の記事",
	);
	expect(await readMarker(page)).toBe("alive");
});

test("記事ページを直接開くと、prerender 済みの HTML が 200 で返る", async ({
	page,
}) => {
	await page.goto("/");
	const href = await page.locator("main li a").first().getAttribute("href");
	expect(href).toMatch(/^\/posts\//);

	const response = await page.goto(href ?? "");
	expect(response?.status()).toBe(200);
	await expect(page.getByRole("article")).toBeVisible();
});

test("記事へ遷移して戻ると、一覧のスクロール位置が先頭へ戻らない", async ({
	page,
}) => {
	await page.goto("/");
	await page.evaluate(() => {
		(
			globalThis as unknown as { scrollTo: (x: number, y: number) => void }
		).scrollTo(0, 200);
	});
	await expect.poll(() => scrollY(page)).toBeGreaterThan(0);

	await page.locator("main li a").first().click();
	await expect(page).toHaveURL(/\/posts\//);

	await page.goBack();
	await expect(page).toHaveURL(/\/$/);
	await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
});
