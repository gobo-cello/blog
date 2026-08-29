# example.com blog app

`example.com` のブログアプリケーション。[React Router](https://reactrouter.com)（Framework Mode）で構築している。ランタイムサーバーは持たず（`ssr: false`）、全ページをビルド時に prerender して静的ファイルとして配信する。

## ディレクトリ構成

```text
app/
├── public/              静的アセット
├── scripts/             開発補助スクリプト
├── src/
│   ├── components/       React コンポーネント
│   ├── content/          記事コンテンツと読み込み・フィード生成ロジック
│   │   └── posts/        ブログ記事（frontmatter 付き MDX）
│   ├── lib/              ドメインロジック
│   ├── mdx/              MDX のプラグインと差し込みコンポーネント
│   ├── routes/           ルーティング対象ページ
│   ├── styles/           グローバルスタイル
│   ├── root.tsx          ルートレイアウト
│   └── routes.ts         ルート定義
└── test/                テスト
```

## コマンド

| コマンド              | 内容                                             |
| :-------------------- | :----------------------------------------------- |
| `npm run dev`         | ローカル開発サーバーを起動                        |
| `npm run build`       | 本番用ビルドを `./dist/client/` に出力            |
| `npm run preview`     | ビルド済みサイトをローカルでプレビュー            |
| `npm test`            | テストを実行                                      |
| `npm run check:types` | 型チェック（`react-router typegen && tsc`）を実行 |
| `npm run check:images`| 未使用画像を検出                                  |
