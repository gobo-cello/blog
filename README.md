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

現時点では、リポジトリ直下に共通の開発ツール設定を置き、CDK applicationは`infra/`ディレクトリで管理します。将来ブログ本体のアプリケーションを追加する場合は、`infra/`と衝突しない別ディレクトリ(例: `app/`)に配置します。

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
├── docs/
│   ├── architecture.md
│   └── adr/
│       ├── 0001-repository-boundary.md
│       └── 0002-github-actions-oidc-deploy.md
├── .github/
│   ├── actions/
│   │   └── setup-node-npm/
│   ├── workflows/
│   │   ├── main-ci.yml
│   │   ├── pr-ci-gate.yml
│   │   ├── deploy-sandbox.yml
│   │   └── deploy-production.yml
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

使用されていないStack、Construct、directory、設定ファイルは先行して作成しません。

## 開発環境

必要なtoolは次のとおりです。

- Git
- Node.js(バージョンは`.node-version`を参照)
- npm
- AWS CLI
- AWS CDK CLI

リポジトリ直下とinfra/はそれぞれ独立したnpm projectです。

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

以降は、Pull Requestでの`cdk diff`、`main`へのmergeによる`deploy-sandbox.yml`の自動実行、`deploy-production.yml`の承認付き実行で運用します。

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
