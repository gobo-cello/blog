# gobo-cello.com blog app

`gobo-cello.com` のブログアプリケーション。[Astro](https://astro.build) で構築している。

## ディレクトリ構成

```text
app/
├── public/            静的アセット
├── scripts/           開発補助スクリプト
├── src/
│   ├── content/blog/  ブログ記事コンテンツ
│   ├── layouts/       ページレイアウト
│   ├── pages/         ルーティング対象ページ
│   └── styles/        グローバルスタイル
└── test/              テスト
```

## コマンド

| コマンド                | 内容                                    |
| :---------------------- | :-------------------------------------- |
| `npm run dev`            | ローカル開発サーバーを起動              |
| `npm run build`          | 本番用ビルドを `./dist/` に出力         |
| `npm run preview`        | ビルド済みサイトをローカルでプレビュー  |
| `npm test`               | テストを実行                            |
| `npm run check:types`    | 型チェック(`astro check`)を実行         |
| `npm run check:images`   | 未使用画像を検出                        |
