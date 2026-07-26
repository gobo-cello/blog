# 0007: sandbox→production間のE2Eスモークテスト

- Status: Accepted
- Date: 2026-07-25

## Context

CloudFrontの`defaultRootObject`がルート("/")宛リクエストにしか適用されず、サブディレクトリ宛リクエスト(例: `/posts/hello-world/`)が404になる不具合が実際に発生した。この種の不具合はCDKのunit test(`Template.fromStack`)では検出できず、実際にデプロイされた環境への実機確認が必要だった。

[ADR 0002](./0002-github-actions-oidc-deploy.md)は、`deploy.yml`の`sandbox` jobと`production` jobを`needs`で直列にすることで、Sandboxへのdeployが失敗した場合にProduction jobが実行されない設計をすでに採用しており、「将来e2eテストのjobを追加する場合は、needs chainを差し替えるだけでよい」としていた。今回、このe2eテストjobを実際に追加する。

## Decision

### テストフレームワークにPlaywrightを使う

最初はbash+curlのインラインスクリプトとして実装したが、アサーションの可読性・失敗時のレポーティング(trace・スクリーンショット)を優先し、`@playwright/test`に置き換えた。`app/`がすでにAstro/TypeScriptのエコシステムであることとも親和性が高い。

現状のテストは`page.goto()`のレスポンスstatusを確認するのみで、実際に描画された内容(タイトル・見出しなど)へのアサーションは行っていない。この点はcurlでのHTTPステータス確認と実質的な検証範囲は変わらないが、実ブラウザで読み込むこと自体は、リソース取得失敗など一部の問題をtrace経由で事後確認しやすくする。表示内容そのものの検証が必要になった場合は、テストを拡張する。

### `e2e/`を独立したnpm projectにする

`app/`・`infra/`と同様、リポジトリ直下・`app/`・`infra/`とは独立したnpm projectとする。`e2e/`のテストは実際にデプロイされたsandbox環境への到達性が前提であり、`app/`のunit test(ビルド成果物に対するオフラインのテスト)とはライフサイクルも実行タイミングも異なるため、別workspaceに分離する。

### PR CIでは静的チェックのみ行い、実際のE2E実行は`deploy.yml`のみで行う

`pr-ci-gate.yml`は、Pull Requestごとに独立したsandbox環境を持たないため、実際にPlaywrightのテストを実行してもテスト対象(PRの変更内容を反映したsandbox環境)と実行結果が一致しない。そのため`pr-ci-gate.yml`では`tsc --noEmit`と`playwright test --list`(ネットワーク不要な構文健全性チェック)のみ行い、実際のテスト実行は`deploy.yml`の`sandbox` job → `e2e-test` job → `production` jobのneeds chainでのみ行う。

### テスト内容: DNS解決・sitemap駆動でのページ配信確認・404確認

- DNS解決: `node:dns/promises`の`resolve4`で、テスト対象ホスト名が名前解決できることを確認する。
- ページ配信: `sitemap-index.xml`を起点に動的にURLを取得し、全ページが200を返すことを確認する。記事の追加・削除・改名があってもテストのメンテナンスが不要になる。
- 404確認: 存在しないパスへのアクセスが404を返すことを確認する([ADR 0006](./0006-static-site-hosting.md)のCloudFront `errorResponses`の403→404マッピングに対するリグレッションガード)。

sitemapに書かれるURLは、build時に固定された`site: "https://blog.example.com"`のホスト名を含む(sandbox/productionで`app/dist`を共用しているため)。ホスト名は無視し、pathだけをテスト対象のbase URLに付け替えて確認する。

### `deploy.yml`のトリガーpathsに`e2e/**`を含める

`deploy.yml`の`on.push.paths`は元々`app/**`・`infra/**`のみで、`e2e/**`を含んでいなかった。この場合、`e2e/`だけの変更は`deploy.yml`自体を実行しないため、次にapp/infraが変わって初めて新しいe2eコードが実際にsandboxへ対して実行されることになり、`e2e-test` jobが失敗した際にsandbox環境側の変更が原因なのか、e2eのテストコード側の変更が原因なのか切り分けられなくなる。`sandbox`/`production`の`cdk deploy`は差分がなければno-opで完了するため、`e2e/**`をpathsに含めても実行コストは小さい。この切り分けやすさを優先し、`e2e/**`をpathsに追加した。

### ブラウザはPlaywright専用のChromiumをダウンロードせず、system Chromeを使う

このリポジトリの他jobは`ubuntu-slim`(ブラウザ非搭載の軽量ランナー、[actions/runner-images](https://github.com/actions/runner-images/blob/main/images/ubuntu-slim/ubuntu-slim-Readme.md)参照)を使っているが、`e2e-test` jobだけは`ubuntu-latest`(Google Chromeプリインストール済み)を使う。テストで使うブラウザの具体的なバージョンには関心がないため、`playwright.config.ts`の`channel: "chrome"`でランナーにプリインストール済みのsystem Chromeをそのまま使い、Playwright専用のChromiumダウンロード・キャッシュ管理を丸ごと避ける。

## Consequences

- `e2e-test` jobだけ`runs-on`が他jobと異なる(`ubuntu-slim`ではなく`ubuntu-latest`)。system Chromeのバージョンはランナーイメージの更新に追従し、このリポジトリ側では固定・管理しない。
- `pr-ci-gate.yml`・`main-ci.yml`・`lefthook.yml`の`pre-push`に、`e2e/`向けの型チェック(と`pr-ci-gate.yml`では`playwright test --list`)を追加した。
- `knip.ts`の`workspaces`に`e2e: {}`を追加した。
- `dependabot.yml`に`/e2e`のnpm ecosystemを追加した(あわせて、これまで漏れていた`/app`も追加した)。
