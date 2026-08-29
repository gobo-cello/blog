import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

function textContent(node: Element): string {
	return node.children
		.map((child) => (child.type === "text" ? child.value : ""))
		.join("");
}

/**
 * ` ```mermaid ` フェンスを `<mermaid chart="...">` 要素へ置き換える rehype プラグイン。
 * MDX の `components` prop で小文字タグ `mermaid` を `<Mermaid>` コンポーネントに
 * マッピングして描画する(src/mdx/components.tsx)。記事ソースは通常の
 * フェンスのままにでき、他の Markdown 処理系へも持ち運べる。
 *
 * `rehype-pretty-code` より前に実行し、Mermaid をコードハイライトの対象から外す。
 */
export function rehypeMermaidFence() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (node.tagName !== "pre" || parent == null || index == null) {
				return;
			}

			const code = node.children.find(
				(child): child is Element =>
					child.type === "element" && child.tagName === "code",
			);
			const className = code?.properties?.className;
			const isMermaid =
				Array.isArray(className) && className.includes("language-mermaid");
			if (!code || !isMermaid) {
				return;
			}

			const mermaidElement: Element = {
				type: "element",
				tagName: "mermaid",
				properties: { chart: textContent(code) },
				children: [],
			};
			parent.children[index] = mermaidElement;
		});
	};
}
