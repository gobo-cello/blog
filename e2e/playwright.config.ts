import { defineConfig, devices } from "@playwright/test";

// baseURLを未設定のまま許容する(knipの静的解析やplaywright test --listなど、
// 実際にテストを実行しないツールがこのファイルをimportする際にエラーで落ちないようにするため)。
// 実際のテスト実行時にE2E_BASE_URLが未設定だと、page.gotoが不正なURLとして失敗し検知できる。
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// "github"レポーターは内部でdotレポーターを継承しており、単体で使うと
	// CIのログが実行したテスト名の見えない"."の羅列になってしまう。
	// "list"を常に併用し、実行中のテスト名を逐次表示させつつ、
	// CI実行時のみ"github"を追加してPRへの失敗インラインアノテーションを有効にする。
	reporter: process.env.CI ? [["list"], ["github"]] : "list",
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
