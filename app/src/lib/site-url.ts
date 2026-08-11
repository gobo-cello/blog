/**
 * `BLOG_DOMAIN_NAME` からサイトの origin を組み立てる。未設定のまま build すると
 * `https://undefined` のような壊れた URL が sitemap や RSS に出力されてしまうため、
 * フォールバックせずに build 時点で気づけるよう例外にする。
 */
export const resolveSiteUrl = (domainName: string | undefined): string => {
	if (!domainName) {
		throw new Error("BLOG_DOMAIN_NAME environment variable is required");
	}
	return `https://${domainName}`;
};
