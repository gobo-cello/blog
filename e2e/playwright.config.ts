import { defineConfig, devices } from "@playwright/test";

// baseURLを未設定のまま許容する(knipの静的解析やplaywright test --listなど、
// 実際にテストを実行しないツールがこのファイルをimportする際にエラーで落ちないようにするため)。
// 実際のテスト実行時にE2E_BASE_URLが未設定だと、page.gotoが不正なURLとして失敗し検知できる。
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: process.env.E2E_BASE_URL,
		trace: "retain-on-failure",
	},
	// バージョン固定に関心がないため、Playwright専用のChromiumをダウンロードせず、
	// ランナー(ubuntu-latest)にプリインストール済みのsystem Chromeをそのまま使う。
	projects: [
		{
			name: "chrome",
			use: { ...devices["Desktop Chrome"], channel: "chrome" },
		},
	],
});
