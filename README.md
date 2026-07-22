# blog

`gobo-cello.com`のブログアプリケーション、コンテンツ、ワークロード用Infrastructure as Codeリポジトリです。

このリポジトリはpublicです。コード、設定、ドキュメント、Issue、Pull Requestなど、リポジトリ内のすべての情報は第三者から閲覧される前提で管理します。

## 目的

`gobo-cello.com`のブログを配信するアプリケーション、コンテンツ、ワークロード用インフラストラクチャをこのリポジトリで管理します。

AWS Organizations全体の共通基盤(監査ログの一元管理、Service Control Policyなど)は、ライフサイクルとfailure domainが異なるため、別のInfrastructure as Codeリポジトリで管理します。

## 管理対象

- ブログのアプリケーションコードとコンテンツ
- ブログの本番環境(`blog-production`)・検証環境(`blog-sandbox`)向けワークロードインフラストラクチャ(`infra/`)
- GitHub ActionsとAWSのOIDC連携
- GitHub Actions用のIAM role

実装されていない項目については、今後このリポジトリへ段階的に追加します。

## 管理対象外

次の情報およびリソースは、このリポジトリでは管理しません。

- AWS Organizations、Management accountの設定
- CloudTrailログの一元管理、IAM Access Analyzerなど組織横断の監査・セキュリティ基盤
- Service Control Policy
- AWS root userの認証情報
- IAM Identity Centerのユーザーおよび認証情報
- 個人のメールアドレスや電話番号
- AWSアカウントの代替連絡先
- ドメインレジストラの認証情報
- Password、API key、access token、private keyなどのsecret
- ドメインそのものの登録および更新

これらは、組織レベルの共通基盤を管理する別のInfrastructure as Codeリポジトリで管理します。

## AWSアカウント構成

このリポジトリがデプロイ対象とするのは、次のAWSアカウントです。

- `blog-production`: 本番ブログのワークロード
- `blog-sandbox`: 開発・検証用のワークロード

これらのアカウントは、AWS Organizations配下のProduction OU・Sandbox OUにそれぞれ所属します。Organizationsの管理、CloudTrailなどの監査ログ基盤、Management accountの運用は、組織レベルの共通基盤を管理する別リポジトリの責務であり、このリポジトリでは前提として扱います。

実際のAWS account ID、Organization ID、メールアドレスなど、公開する必要のない環境固有情報はリポジトリへ保存しません。

## 認証方針

人間によるAWSへのアクセスにはIAM Identity Centerを使用します。

GitHub ActionsからAWSへのアクセスにはOpenID Connectを使用し、短時間のみ有効な一時認証情報を取得します。

長期的なAWS access keyは使用しません。

## Public repositoryとしての方針

このリポジトリには、公開されても問題のない情報だけを保存します。

次の情報を、コード、設定ファイル、ドキュメント、ログ、コメント、Issue、Pull Requestへ含めてはいけません。

- AWS access key
- AWS session token
- Password
- MFA seed
- Private key
- API key
- GitHub personal access token
- 個人のメールアドレスや電話番号
- AWS root userに関する情報
- その他のsecretまたは個人情報

環境固有の値が必要な場合は、次のいずれかを使用します。

- ローカルの環境変数
- GitHub Actions Variables
- GitHub Environment Variables
- GitHub Secrets
- AWS Systems Manager Parameter Store
- AWS Secrets Manager

AWS認証情報そのものはGitHub Secretsへ保存せず、OIDCを使用します。

## ディレクトリ構成

リポジトリ直下に共通の開発ツール設定を置き、CDK applicationは`infra/`、ブログ本体のアプリケーションは`infra/`と衝突しない`app/`ディレクトリで、それぞれ独立したnpm projectとして管理します。

```text
blog/
├── infra/
│   ├── bin/
│   │   └── infra.ts
│   ├── lib/
│   │   ├── config/
│   │   │   ├── accounts.ts
│   │   │   ├── cdk-bootstrap.ts
│   │   │   ├── environments.ts
│   │   │   ├── github.ts
│   │   │   └── tags.ts
│   │   └── stacks/
│   │       └── github-deploy-role-stack.ts
│   ├── test/
│   │   ├── accounts.test.ts
│   │   └── github-deploy-role-stack.test.ts
│   ├── cdk.json
│   ├── jest.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── app/
│   ├── src/
│   │   ├── content/
│   │   │   └── blog/
│   │   │       └── <slug>/
│   │   │           ├── index.md
│   │   │           └── *.jpg,png
│   │   ├── content.config.ts
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro
│   │   └── pages/
│   │       ├── index.astro
│   │       ├── posts/[slug].astro
│   │       ├── categories/[category].astro
│   │       ├── tags/[tag].astro
│   │       ├── rss.xml.ts
│   │       └── 404.astro
│   ├── scripts/
│   │   └── check-unused-images.ts
│   ├── test/
│   ├── astro.config.mjs
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── docs/
│   ├── architecture.md
│   └── adr/
│       ├── 0001-repository-boundary.md
│       ├── 0002-github-actions-oidc-deploy.md
│       ├── 0003-dns-and-certificate.md
│       └── 0004-blog-implementation-approach.md
├── .github/
│   ├── actions/
│   │   └── setup-node-npm/
│   ├── workflows/
│   │   ├── main-ci.yml
│   │   ├── pr-ci-gate.yml
│   │   └── deploy.yml
│   ├── copilot-instructions.md
│   └── dependabot.yml
├── .claude/
│   └── CLAUDE.md
├── .gitignore
├── .node-version
├── .npmrc
├── lefthook.yml
├── package.json
├── README.md
└── SECURITY.md
```

`infra/`配下は次の責務で分割しています。

- `infra/bin/`: CDK applicationのentry point
- `infra/lib/stacks/`: AWS accountまたはdeployment boundaryごとのStack
- `infra/lib/constructs/`: 複数のAWS resourceからなる論理的な機能単位(実装対象が増えた場合に追加)
- `infra/lib/config/`: secretを含まない環境設定
- `infra/test/`: CDK templateおよびConstructのテスト

`app/`はAstro(静的サイト生成)によるブログ本体のアプリケーションで、次の責務で分割しています。設計判断の詳細は[ADR 0004](./docs/adr/0004-blog-implementation-approach.md)を参照してください。

- `app/src/content/`: 記事本体(Markdown)と、記事ごとにcolocationされた画像
- `app/src/content.config.ts`: content collectionのschema定義(Zod)
- `app/src/layouts/`・`app/src/pages/`: ページとレイアウト
- `app/scripts/`: 記事から参照されていない画像を検出するCIチェックスクリプトなど

使用されていないStack、Construct、directory、設定ファイルは先行して作成しません。

## 開発環境

必要なtoolは次のとおりです。

- Git
- Node.js(バージョンは`.node-version`を参照)
- npm
- AWS CLI
- AWS CDK CLI

リポジトリ直下・`infra/`・`app/`はそれぞれ独立したnpm projectです。

リポジトリ直下の依存関係(lint、git hooks)をインストールします。

```sh
npm ci
```

`infra/`の依存関係をインストールします。

```sh
cd infra
npm ci
```

TypeScriptを型チェックします。

```sh
cd infra
npm run build
```

テストを実行します。

```sh
cd infra
npm test
```

CloudFormation templateを生成します。

```sh
cd infra
npx cdk synth
```

`app/`の依存関係をインストールします。

```sh
cd app
npm ci
```

ローカル開発サーバーを起動します。

```sh
cd app
npm run dev
```

静的サイトをビルドします。

```sh
cd app
npm run build
```

テスト、型チェック、未参照画像チェックを実行します。

```sh
cd app
npm test
npm run check:types
npm run check:images
```

## Lintとgit hooks

このリポジトリはLintに[Biome](https://biomejs.dev/)を使用します。

```sh
npm run check
```

git hooksには[lefthook](https://github.com/evilmartians/lefthook)を使用します。`npm ci`実行時に`prepare`スクリプトが自動的に`lefthook install`を実行します。

- pre-commit: 変更されたファイルへBiomeを適用します。
- pre-push: `infra/`でbuild、テスト、`cdk synth`を実行します。
- commit-msg: Conventional Commitsの形式を検証します。

## AWS CLIプロファイル

人間によるAWSへのアクセスにはIAM Identity Center(AWS SSO)を使用し、長期的なAWS access keyは使用しません。

ローカルの`~/.aws/config`に、account・role単位でprofileを分けて設定します。実際のaccount IDやSSO start URLはリポジトリへ保存しないため、プレースホルダーで示します。

```ini
[profile blog-production]
sso_session = gobo-cello
sso_account_id = 実際のProduction account ID
sso_role_name = AdministratorAccess
region = ap-northeast-1
output = json

[profile blog-sandbox]
sso_session = gobo-cello
sso_account_id = 実際のSandbox account ID
sso_role_name = AdministratorAccess
region = ap-northeast-1
output = json

[sso-session gobo-cello]
sso_start_url = 実際のSSO Start URL
sso_region = ap-northeast-1
sso_registration_scopes = sso:account:access
```

`aws sso login --profile <profile名>`でログインしてから、各`--profile`オプションでコマンドを実行します。

## GitHub ActionsとAWSの接続

GitHub ActionsからAWSへは、OIDCによる一時認証だけを使用します。長期的なAWS access keyは発行しません。設計の詳細は[docs/architecture.md](./docs/architecture.md)と[ADR 0002](./docs/adr/0002-github-actions-oidc-deploy.md)を参照してください。

`infra/`には、GitHub ActionsがOIDCでdeployするための`SandboxGithubDeployRoleStack` / `ProductionGithubDeployRoleStack`が定義されています。GitHub Actions自身は自分のtrust関係を初回だけ自動デプロイできないため(chicken-and-egg)、次の手順を人手で1回だけ行う必要があります。

1. ローカルのAdministratorAccess profileで、両accountにCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Sandbox account ID>/ap-northeast-1 --profile blog-sandbox
   npx cdk bootstrap aws://<Production account ID>/ap-northeast-1 --profile blog-production
   ```

2. `infra/.env.local`(gitignore対象、`.env.example`を元に作成)にaccount IDを設定し、ローカルから初回だけ手動でdeployします。`.env.local`は`cdk.json`の`app`コマンドが`--env-file-if-exists`で自動読み込みするため、`cdk synth`・`cdk deploy`実行前に手動でsourceする必要はありません。

   ```sh
   cd infra
   npx cdk deploy SandboxGithubDeployRoleStack --profile blog-sandbox
   npx cdk deploy ProductionGithubDeployRoleStack --profile blog-production
   ```

3. deploy出力の`GithubDeployRoleArn`を控えます。

4. GitHubリポジトリに Environment `sandbox` / `production` を作成し、`production`にRequired Reviewersを設定します。

5. 次のGitHub Variablesを登録します。

   - Repository Variables: `AWS_BLOG_SANDBOX_ACCOUNT_ID`、`AWS_BLOG_PRODUCTION_ACCOUNT_ID`
   - Environment `sandbox` Variables: `AWS_BLOG_SANDBOX_DEPLOY_ROLE_ARN`(手順3のSandbox側ARN)
   - Environment `production` Variables: `AWS_BLOG_PRODUCTION_DEPLOY_ROLE_ARN`(手順3のProduction側ARN)

以降は、Pull Requestでの`cdk diff`、`main`へのmergeによる`deploy.yml`の自動実行(`sandbox` job)、その成功後の`production` jobの承認付き実行で運用します。

## ドメインとDNS

`blog.gobo-cello.com`のhosted zoneと、CloudFront用のACM証明書(DNS検証)を`ProductionDnsStack`で管理しています。設計の詳細は[docs/architecture.md](./docs/architecture.md)と[ADR 0003](./docs/adr/0003-dns-and-certificate.md)を参照してください。

CloudFrontで使用するACM証明書は`us-east-1`でしか発行できないため、`blog-production`accountの主リージョン(`ap-northeast-1`)とは別に`us-east-1`のCDK bootstrapが必要です。また、apex hosted zone(`gobo-cello.com`)は`aws-platform`リポジトリが管理しており、cross-repositoryでのname server受け渡しが必要なため、次の順序で1回だけ手動セットアップします。

1. `aws-platform`リポジトリで、apex hosted zone(`DnsStack`)を先にdeployし、出力された`ApexHostedZoneNameServers`を控えます。

2. お名前.comの管理画面で、`gobo-cello.com`のネームサーバーを1.の値へ変更します。反映には時間がかかる場合があります。

3. `blog-production`accountで、`us-east-1`のCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Production account ID>/us-east-1 --profile blog-production
   ```

4. `ProductionDnsStack`をdeployします。証明書のDNS検証は、2.の委譲が反映されるまで完了を待つ場合があります。

   ```sh
   cd infra
   npx cdk deploy ProductionDnsStack --profile blog-production
   ```

5. deploy出力の`BlogHostedZoneNameServers`を、`aws-platform`リポジトリの`BLOG_SUBDOMAIN_NAME_SERVERS`環境変数に設定し、`aws-platform`側の`DnsStack`を再deployします。

6. `dig blog.gobo-cello.com NS`で委譲が反映されていること、`aws acm describe-certificate`等で証明書が`ISSUED`になっていることを確認します。

7. 動作確認できたら、`deploy.yml`の`production` jobへ`ProductionDnsStack`を追加するコミットをmergeします(初回は手動deployで検証してからCIへ組み込みます)。

## Git運用

`main` branchは常にbuild、test、CDK synthが成功する状態を維持します。

変更は原則として作業branchで行い、Pull Requestを通じて`main`へmergeします。

Commit messageはConventional Commitsに従います。

```text
<type>(<scope>): <日本語の要約>
```

例:

```text
feat(infra): ブログ配信用CloudFrontディストリビューションを追加
test(infra): S3 bucket policyのテストを追加
docs(architecture): AWSアカウント構成を更新
chore(deps): AWS CDKを更新
```

## Security

脆弱性またはsecretの漏えいを発見した場合は、public Issueへ詳細を投稿しないでください。

対応方法については[`SECURITY.md`](./SECURITY.md)を参照してください。

## License

Licenseは別途決定します。Licenseを追加するまでは、著作権者から明示的に許可された範囲を除き、コードの利用、複製、変更、再配布は許諾されません。
