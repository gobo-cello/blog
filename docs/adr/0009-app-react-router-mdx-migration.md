# 0009: `app/` の Astro から React Router + MDX への移植

- Status: Accepted
- Date: 2026-08-29

## Context

`app/` は ADR 0004 で Astro（SSG）として実装したが、React での運用・ドッグフーディングを目的に
React へ全面移植する。配信方式（SSG、S3 + CloudFront、GitHub Actions 専用デプロイ）は変えない。

Astro と同一構成の逐語移植ではなく、新フレームワーク（React Router + Vite）のベストプラクティスに
合わせて組み直した。本 ADR は ADR 0004 のうち次を上書きする。①配信方式（SSG）・④記事ごと
ディレクトリへの画像 colocation・⑤画像の git 管理・⑦Vitest は変更しない。

## Decision

### ① フレームワーク: React Router 8（Framework Mode）、`ssr: false` + 全ページ prerender

ランタイムサーバーを持たない静的配信を維持するため `ssr: false` とし、`prerender` に全 URL を
列挙してビルド時に静的 HTML 化する。クローラ・OGP 展開・RSS リーダーへは prerender 済み HTML で
応答し、遷移はクライアントサイドルーティングで行う。ルート単位のコード分割は framework mode が
標準で行う。

`react-router.config.ts` の `buildEnd` から RSS（`rss.xml`）と単一 `sitemap.xml` を
`dist/client/` へ直接書き出す。Astro の `sitemap-index.xml` + shard 構成は、この規模では不要な
ため単一ファイルへ簡略化した（ADR 0004 ⑥のサイトマップ形式を上書き）。

Next.js の `output: export` や `vite-react-ssg` も候補だったが、既存 infra / app が Vite 前提で
あること、React 公式が推奨するフレームワークの一つであることから React Router を選んだ。

### ② コンテンツ: MDX（`@mdx-js/rollup`） + `import.meta.glob`

ADR 0004 ③は「MDX（任意コード実行）の複雑さ・セキュリティを避ける」として素の Markdown を
選んでいたが、記事の追加はリポジトリ管理者のみであり、リッチ表現（Mermaid 図・埋め込み
コンポーネント）を素直に扱えることの利点が上回ると判断し、MDX へ移行する。

- 記事は `src/content/posts/<slug>/index.mdx`。frontmatter は `remark-frontmatter` +
  `remark-mdx-frontmatter` で取り出し、`src/content/schema.ts` の Zod schema で境界検証する。
- `src/content/posts.ts` は Node の `fs` で記事ディレクトリを走査する（`import.meta.glob` は
  使わない。`react-router.config.ts` や Knip の設定読み込みは Vite 変換を経ないため）。
- MDX 本文（React コンポーネント）は `routes/post.tsx` の module scope で
  `import.meta.glob(..., { eager: true })` により取得する。全記事を post ルートの chunk へ
  同梱する。記事数が増えて肥大化した場合は、各 `.mdx` を個別 route にする方式へ移す。
- frontmatter schema から `cover` を削除した。公開記事に cover も本文埋め込み画像も現状存在せず、
  画像最適化パイプラインは提供価値がない。必要になった時点で Vite の画像取り込みで再導入する。

### ③ 構文ハイライトと Mermaid の再実装

- コードブロックの構文ハイライトは `rehype-pretty-code`（Shiki、テーマ `github-dark`）で
  ビルド時に静的マークアップ化する。クライアント JS はゼロ。` ```ts title="foo.ts" ` 記法に
  対応し、`astro-expressive-code` のファイル名タブ相当を維持する。
- Mermaid は小さな rehype プラグイン（`src/mdx/rehype-mermaid-fence.ts`）で ` ```mermaid `
  フェンスを `<mermaid>` 要素へ退避し、`src/components/Mermaid.tsx`（クライアント
  コンポーネント）が hydration 時に `mermaid` を動的 import して SVG 描画する。図を含むページ
  だけが `mermaid`（約 1MB）を読み込む。prerender / hydration 前は Mermaid ソースを
  `<pre>` で表示する。ビルド時 SVG 化（headless ブラウザが必要）は CI のビルド依存を増やすため
  採らなかった。

### ④ TypeScript バージョンを `infra/` / ルートと統一（`^7`）

ADR 0004 ⑧が `app/` だけ TypeScript 6 系に留めていた根拠は `@astrojs/check` の peer
dependency だった。`@react-router/dev@8` は TypeScript 7 を許容するため、分ける理由がなくなり
`^7` へ統一する。

## Consequences

- Astro 関連の依存（`astro`・`@astrojs/*`・`astro-expressive-code`・`@expressive-code/core`・
  `astro-mermaid`）を `app/` から削除した。React Router / React / MDX ツールチェーンを追加した。
- ビルド出力先が `app/dist` から `app/dist/client` へ、ハッシュ付きアセットのディレクトリ名が
  `_astro/` から `assets/`（Vite 既定）へ変わった。`infra/bin/infra.ts` の `siteContentPath` と
  `infra/lib/constructs/static-site-hosting.ts`（CloudFront の 404 マッピングと invalidation
  絞り込み、ADR 0008）を追随させた。
- `e2e/tests/smoke.spec.ts` を単一 `sitemap.xml` に追随させた。検証内容（DNS 解決・トップページ
  表示・sitemap 掲載ページの 200 確認・存在しないパスの 404 確認）は変えていない。
- MDX 変換に使う remark / rehype プラグイン群は `devDependencies` に置き、Knip の
  production 解析では `feed.ts` を `buildEnd` 到達の entry として明示している。
