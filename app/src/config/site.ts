import { z } from "zod";

/**
 * サイト設定を、環境変数という文字列の寄せ集めから型付きの 1 オブジェクトへまとめて
 * 解決する。RSS / sitemap 生成(`src/content/feed.ts`)や `vite.config.ts` など複数の
 * ビルド時コードが同じ設定値をそれぞれ `process.env` から読むのをやめ、パースと
 * バリデーションの境界をこのモジュール 1 箇所に閉じ込める(parse, don't validate)。
 *
 * `process.env` からの解決はモジュール読み込み時ではなく `resolveSiteConfig` の
 * 呼び出し時に行う。`react-router.config.ts` がこのモジュールを(`feed.ts` 経由で)
 * 静的 import しているため、トップレベルで解決すると `BLOG_DOMAIN_NAME` を渡さない
 * `app` の vitest 起動時や `react-router typegen` 実行時にまで例外が波及してしまう。
 * canonical URL の hard fail は、RSS / sitemap の resource route loader
 * (`routes/{rss,sitemap}.xml.ts`)が prerender 時に値を読むときに起きれば十分
 * (従来の `lib/site-url.ts` も呼び出し時に投げていた)。
 */

const siteConfigSchema = z.object({
	/**
	 * canonical URL(sitemap / RSS に出力される絶対 URL)の組み立てに使う。未設定の
	 * まま build すると `https://undefined` のような壊れた URL がそのまま静的ファイルへ
	 * 出力されてしまう。canonical URL は誤りが許されないため、フォールバックせず
	 * build 時点で必ず失敗させて気づけるようにする。
	 */
	blogDomainName: z
		.string({ error: "BLOG_DOMAIN_NAME environment variable is required" })
		.min(1, "BLOG_DOMAIN_NAME environment variable is required"),
	/**
	 * ヘッダーの外部サイトへのナビゲーションリンク先にしか使われない。既定値のまま
	 * 表示されてもページ自体は壊れないため、`blogDomainName` と違って未設定でも
	 * build を止めず安全な既定ドメインへフォールバックする。この扱いの差
	 * (canonical URL は hard fail / ナビリンクは既定値許容)が両者の違い。
	 */
	apexDomainName: z.string().optional().default("example.com"),
});

type SiteConfigValues = z.infer<typeof siteConfigSchema>;

export type SiteConfig = Readonly<
	SiteConfigValues & {
		siteUrl: string;
		apexUrl: string;
	}
>;

/**
 * 任意の環境変数マップから設定を解決する純粋関数。副作用もモジュールスコープの
 * 状態も持たないため、単体テストからはこの関数だけを検証すればよい。
 */
export function resolveSiteConfig(env: NodeJS.ProcessEnv): SiteConfig {
	const parsed = siteConfigSchema.safeParse({
		blogDomainName: env.BLOG_DOMAIN_NAME,
		apexDomainName: env.APEX_DOMAIN_NAME,
	});
	if (!parsed.success) {
		throw new Error(
			parsed.error.issues.map((issue) => issue.message).join("; "),
			{ cause: parsed.error },
		);
	}

	const { blogDomainName, apexDomainName } = parsed.data;
	return {
		blogDomainName,
		apexDomainName,
		siteUrl: `https://${blogDomainName}`,
		apexUrl: `https://${apexDomainName}`,
	};
}
