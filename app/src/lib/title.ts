const INLINE_CODE_PATTERN = /`([^`]+)`/g;

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/**
 * タイトル文字列中の `code` 記法を <code> 要素に変換した HTML を返す。
 * 記事タイトルや一覧の見出しなど、装飾表示が必要な箇所で使用する。
 */
export function renderTitleHtml(title: string): string {
	return title
		.split(INLINE_CODE_PATTERN)
		.map((part, index) =>
			index % 2 === 1 ? `<code>${escapeHtml(part)}</code>` : escapeHtml(part),
		)
		.join("");
}

/**
 * タイトル文字列から `code` 記法のバッククォートだけを取り除いたプレーンテキストを返す。
 * <title> や RSS など、HTML を解釈できない箇所で使用する。
 */
export function plainTitle(title: string): string {
	return title.replace(INLINE_CODE_PATTERN, "$1");
}
