/**
 * prerender される `/404`(`routes/not-found.tsx`)と、loader が 404 を throw したときの
 * `root.tsx` の `ErrorBoundary` の両方が使う共通表示。マークアップを1箇所に。
 */
export default function NotFound() {
	return (
		<>
			<h1>404</h1>
			<p>ページが見つかりませんでした。</p>
			<a href="/">トップページへ戻る</a>
		</>
	);
}
