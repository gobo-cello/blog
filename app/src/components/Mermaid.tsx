import { useEffect, useId, useState } from "react";

/**
 * Mermaid の theme 変数と、その値の取得元となる global.css の CSS カスタム
 * プロパティの対応表。配色・フォントは global.css の `--color-*` / `--font-sans`
 * を単一の正とし、ここでは「どの Mermaid 変数がどの CSS 変数に対応するか」と、
 * 変数が解決できなかったときの保険値(移植当時の実値)だけを持つ。
 */
const MERMAID_THEME_SOURCES = {
	background: { cssVar: "--color-background", fallback: "#f7f6f3" },
	primaryColor: { cssVar: "--color-surface", fallback: "#efede8" },
	primaryTextColor: { cssVar: "--color-foreground", fallback: "#2e2e2b" },
	primaryBorderColor: { cssVar: "--color-accent", fallback: "#a24e2c" },
	lineColor: { cssVar: "--color-muted", fallback: "#66645f" },
	secondaryColor: { cssVar: "--color-border", fallback: "#ddd8cf" },
	tertiaryColor: { cssVar: "--color-background", fallback: "#f7f6f3" },
	textColor: { cssVar: "--color-foreground", fallback: "#2e2e2b" },
	fontFamily: {
		cssVar: "--font-sans",
		fallback:
			'-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Yu Gothic", Meiryo, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	},
} as const;

/**
 * global.css の CSS 変数を実体化して Mermaid の themeVariables を組む。
 * mermaid.render は useEffect 内(hydration 後のクライアント)でしか走らないため、
 * ここで getComputedStyle により document から現在値を読める。
 * 変数が空文字で返った場合(ビルド設定や読み込み順の都合)は、図が真っ白に
 * ならないよう対応表の fallback を使う。
 * `--font-sans` は getComputedStyle だとフォントスタック全体の文字列で返るため、
 * そのまま fontFamily へ渡す。
 */
function readMermaidTheme(): Record<string, string> {
	const computed = getComputedStyle(document.documentElement);
	return Object.fromEntries(
		Object.entries(MERMAID_THEME_SOURCES).map(([key, { cssVar, fallback }]) => [
			key,
			computed.getPropertyValue(cssVar).trim() || fallback,
		]),
	);
}

/**
 * ` ```mermaid ` フェンス(rehype-mermaid-fence が `<mermaid>` に変換)を描画する。
 * mermaid 本体は約 1MB あるため、図を含むページの hydration 時にだけ動的 import する。
 * prerender / hydration 前は Mermaid ソースをそのまま表示する。
 */
export default function Mermaid({ chart }: { chart: string }) {
	const [svg, setSvg] = useState("");
	const renderId = `mermaid-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			const { default: mermaid } = await import("mermaid");
			mermaid.initialize({
				startOnLoad: false,
				theme: "base",
				themeVariables: readMermaidTheme(),
			});
			const { svg: rendered } = await mermaid.render(renderId, chart);
			if (!cancelled) {
				setSvg(rendered);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [chart, renderId]);

	if (!svg) {
		return (
			<pre className="mermaid-source">
				<code>{chart}</code>
			</pre>
		);
	}

	return (
		<div
			className="my-6 flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid.render が生成した SVG。記事はリポジトリ管理者のみが追加する
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
