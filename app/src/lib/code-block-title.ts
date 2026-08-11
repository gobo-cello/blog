/**
 * コードブロックのタイトルを解決する。`title` が未指定の場合のみ、
 * astro-expressive-code のファイル名タブへ言語名を表示する。
 */
export const resolveCodeBlockTitle = (
	title: string | undefined,
	language: string | undefined,
): string | undefined => {
	if (!title && language) {
		return language;
	}
	return title;
};
