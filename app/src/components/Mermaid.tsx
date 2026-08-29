import { useEffect, useId, useState } from "react";

/**
 * 現行の astro.config.ts の mermaid 設定から移植したテーマ変数。
 * 本文の配色(global.css の `--color-*`)と揃える。
 */
const MERMAID_CONFIG = {
	startOnLoad: false,
	theme: "base",
	themeVariables: {
		background: "#f7f6f3",
		primaryColor: "#efede8",
		primaryTextColor: "#2e2e2b",
		primaryBorderColor: "#a24e2c",
		lineColor: "#66645f",
		secondaryColor: "#ddd8cf",
		tertiaryColor: "#f7f6f3",
		textColor: "#2e2e2b",
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Yu Gothic", Meiryo, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	},
} as const;

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
			mermaid.initialize(MERMAID_CONFIG);
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
