import { parseTitleSegments } from "../lib/title";

interface TitleProps {
	title: string;
}

/**
 * タイトル中の `code` 記法を <code> 要素として描画する。
 * HTML 文字列を組み立てて dangerouslySetInnerHTML で挿入する方式を採らず、
 * React 要素として直接描画する。手作業の HTML エスケープが不要になり、
 * エスケープは React が担うため XSS の余地が構造的に無くなる。
 *
 * 描画先の要素(<h1> / <a> など)は呼び出し側ごとに異なるため、ここでは
 * インライン内容だけを fragment で返し、ラッパー要素は各呼び出し側に委ねる。
 * code でない区間は素のテキストノードとして返し、出力 DOM を素朴な文字列描画と一致させる。
 */
export default function Title({ title }: TitleProps) {
	return (
		<>
			{parseTitleSegments(title).map((segment, index) =>
				segment.code ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: 分割結果は描画ごとに固定順で、要素の並び替え・挿入・削除が起きないため index が安定キーになる
					<code key={index}>{segment.text}</code>
				) : (
					segment.text
				),
			)}
		</>
	);
}
