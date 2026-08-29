import type { MDXComponents } from "mdx/types";
import Mermaid from "../components/Mermaid";

/**
 * MDX 本文に渡すコンポーネント。`rehype-mermaid-fence` が生成する
 * 小文字タグ `<mermaid>` を `<Mermaid>` にマッピングする。
 */
export const mdxComponents: MDXComponents = {
	mermaid: Mermaid,
};
