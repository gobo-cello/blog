const INLINE_CODE_PATTERN = /`([^`]+)`/g;

export interface TitleSegment {
	code: boolean;
	text: string;
}

/**
 * タイトル文字列を `code` 記法で区切り、各区間が code かどうかを持つ配列にする。
 * `String.prototype.split` に捕捉グループ付き正規表現を渡すと、奇数番目の要素が
 * バッククォートで囲まれた中身になる(INLINE_CODE_PATTERN のグループ 1)。
 * この分割規則は plainTitle と共通で、HTML 文字列ではなく描画用の構造だけを返す。
 * 実際の <code> 要素の生成は components/Title.tsx が React 要素として行う。
 */
export function parseTitleSegments(title: string): TitleSegment[] {
	return title
		.split(INLINE_CODE_PATTERN)
		.map((text, index) => ({ code: index % 2 === 1, text }));
}

/**
 * タイトル文字列から `code` 記法のバッククォートだけを取り除いたプレーンテキストを返す。
 * <title> や RSS など、HTML を解釈できない箇所で使用する。
 */
export function plainTitle(title: string): string {
	return title.replace(INLINE_CODE_PATTERN, "$1");
}
