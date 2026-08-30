---
paths:
  - "infra/**/*.ts"
  - "infra/.env.example"
  - ".github/workflows/*.yml"
  - "app/vite.config.ts"
  - "app/react-router.config.ts"
  - "app/src/config/site.ts"
  - "app/src/routes/rss.xml.ts"
  - "app/src/routes/sitemap.xml.ts"
---

# 環境変数を追加・変更する際に確認するファイル

- `infra/lib/config/environments.ts`・`infra/lib/config/dns.ts`など: 環境変数のparse処理
- `infra/.env.example`: ローカル開発用の一覧
- `.github/workflows/deploy.yml`: 全ての`cdk deploy`ステップのenv。`bin/infra.ts`はターゲットのstackに関わらず全stackを構築するため、「このstackはこの環境変数を使わないから不要」という判断はできない
- `.github/workflows/pr-ci-gate.yml`: `cdk-synth`・`cdk-diff`ジョブのenv
- appのbuildにも影響する値の場合: `app/src/config/site.ts`(`process.env`からのサイト設定のparse。`BLOG_DOMAIN_NAME`の必須チェックなど)・`app/vite.config.ts`(`.env.local`を`process.env`へ橋渡しするループ。server側の`config/site.ts`用)・`app/src/routes/rss.xml.ts`・`app/src/routes/sitemap.xml.ts`(prerender時に`resolveSiteConfig(process.env)`を呼ぶresource route)。`VITE_`プレフィックスの値はViteが`import.meta.env`経由でクライアントバンドルへ自動露出するため、ここへの追記は不要(`app/src/root.tsx`が参照)
