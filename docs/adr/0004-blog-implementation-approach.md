# 0004: ブログの実装方式

- Status: Accepted
- Date: 2026-07-23

## Context

`blog`リポジトリには、これまで`infra/`(CDK、OIDCデプロイ基盤・DNS/証明書)しか存在せず、ブログ本体のアプリケーションがなかった。`docs/architecture.md`は将来ブログ本体を追加する場合に`infra/`と衝突しない別ディレクトリ(`app/`)へ配置することをすでに明言しており、配信インフラも将来的にS3・CloudFrontを前提としている(ADR 0003)。

ブログ本体の実装方式について、次の分岐点を検討した。

## Decision

### ① 配信方式: 静的サイト(SSG)

S3+CloudFrontで配信する。既存infra設計はcompute層(Lambda等)を前提としておらず、個人ブログの用途では動的サイト(SSR/API)は過剰である。

### ② フレームワーク: Astro

content-focusedな設計でMarkdownを標準サポートし、`@astrojs/rss`・`@astrojs/sitemap`という公式integrationでRSS・sitemapを容易に実装できる。デフォルトでJSをほぼ出力しないため、静的ブログに適している。

### ③ コンテンツ形式: Markdown(frontmatter)

MDX(コンポーネント埋め込み)は個人ブログの要件に対して過剰であり、任意コードが記事内で実行可能になることによる複雑さ・セキュリティ面の考慮も避けたい。frontmatterで`title`・`description`・`date`・`category`・`tags`・`cover`・`draft`を管理する。

### ④ ディレクトリ構成: 記事ごとのディレクトリに画像をcolocation

Astro 6以降のContent Layer API(`defineCollection` + `glob()` loader)を用い、`src/content/blog/<slug>/index.md`と、その記事専用の画像を同一ディレクトリに配置する構成にする。`glob({ pattern: "**/index.md", base: "./src/content/blog" })`により、`index.md`を持つディレクトリ名がそのままURLのslugになる(Astroの`getContentEntryIdAndSlug`が`/index`suffixを取り除く挙動を利用)。

画像は`public/`ではなく`src/`配下に置くことで、Astroのビルド時最適化(`astro:assets`の`<Image />`、`schema: ({ image }) => ...`のimage() helper)を効かせる。`public/`直下の画像は最適化パイプラインを通らないため使わない。

### ⑤ 画像・添付ファイルの保存場所: gitで管理する(LFSなし)

画像は通常のgitで記事とともにコミットする。個人ブログ規模の画像点数であれば、Git LFSや外部ストレージ(S3直接運用、画像CDNなど)を追加する運用コストに見合わない。リポジトリサイズが実際に問題になった時点で再評価する(CloudTrailログのStorage Class判断([aws-platformのdocs/architecture.md](../../../aws-platform/docs/architecture.md)参照)と同じ考え方)。

不要画像(記事から参照されなくなった画像)は`app/scripts/check-unused-images.ts`でCI検出する。記事ディレクトリ内の画像ファイルのうち、同ディレクトリの`index.md`から相対パス参照されていないものを検出し、CIを失敗させる軽量スクリプトとした。

### ⑥ URL設計・タクソノミー

- 記事: `/posts/<slug>/`
- カテゴリ別アーカイブ: `/categories/<category>/`
- タグ別アーカイブ: `/tags/<tag>/`
- RSS: `/rss.xml`
- サイトマップ: `/sitemap-index.xml`(`@astrojs/sitemap`のデフォルト)

ドメイン自体が`blog.gobo-cello.com`であるため、`/blog/`のようなprefixは付けない。カテゴリは記事ごとに1つ(主分類)、タグは複数可(横断的なトピック分類)というシンプルな2軸タクソノミーにする。

### ⑦ テストランナー: `app/`だけVitestを使う

`infra/`はJestを使っているが、AstroはViteネイティブであり、Astro公式もVitestを推奨している。`infra/`とテストランナーが分かれることを許容し、フレームワークとの親和性を優先する。

### ⑧ TypeScriptバージョン: `app/`だけ`^6.0.3`に留める

`infra/`は`typescript: ~7.0.2`を使用しているが、型チェックに使う`@astrojs/check@0.9.9`のpeer dependencyが`^5.0.0 || ^6.0.0`までしか許容しないため、`app/`ではTypeScript 6系に留める。`@astrojs/check`が7系に対応した時点で追随する。

## Consequences

- 実際のAWSリソース(S3・CloudFrontなどの配信基盤)の構築は、ロードマップG(Sandbox環境構築)・H(Production環境構築)で行う。本ADRの範囲はアプリケーション実装方式の決定とローカル開発環境の整備までである。
- `app/`は`infra/`と同様、リポジトリ直下・`infra/`とは独立したnpm projectとする。ビルドツールチェーンが互いのlockfileを汚染しない。
- `pr-ci-gate.yml`・`main-ci.yml`・`lefthook.yml`の`pre-push`に`app/`向けのbuild・test・check:images・check:typesを追加した。
- 将来、記事数が増えて画像点数が実運用上の問題(リポジトリサイズ、clone時間など)になった場合は、Git LFSまたは外部ストレージへの移行を再検討する。
- リポジトリ直下に最小限の`biome.json`を新規追加した(これまで存在せず、Biomeは完全にデフォルト設定で動作していた)。no-config運用を維持する方針のため、`vcs`と`overrides`以外のキー(`formatter`・`linter`のpresetなど)は追加せず、デフォルト挙動のままにしている。`$schema`もCDN上のURLではなく`./node_modules/@biomejs/biome/configuration_schema.json`を参照する。
  - `vcs.useIgnoreFile: true`: `.gitignore`対象の生成物(`infra/cdk.out`、`app/dist`、`app/.astro`など)を自動的にBiomeの走査対象から除外する。これがないと、手元に生成物が残っている状態で`biome check .`を実行した際に誤検出する。CIは常にcleanなcheckoutから実行するため本来は影響しないが、ローカル開発での誤検出を避けるため設定した。
  - `overrides`(`**/*.astro`の`noUnusedImports`・`noUnusedVariables`をoff): Biomeの`.astro`対応はfrontmatter部分だけを解析し、テンプレート内で使われるprops・importの使用を認識しないため、これらのruleが全`.astro`ファイルで誤検出する。pre-commit hookは`--write`で自動修正するため、対処しないと実際に使われているimportやpropsがコミット時に誤って削除される。
