# アーキテクチャ

## AWS Organization 構成

このリポジトリがデプロイ対象とするアカウントは、AWS Organizations配下の次の2アカウントです。

```text
AWS Organizations
├── Production OU
│   └── blog-production
└── Sandbox OU
    └── blog-sandbox
```

AWS Organizations自体の管理、Management account、CloudTrailなどの組織横断の監査ログ基盤は、別のInfrastructure as Codeリポジトリの責務であり、このリポジトリでは前提として扱います。

## 責務

### blog-production

* 本番ブログのワークロード
* 本番ドメインへの配信

### blog-sandbox

* 開発・検証用のワークロード

## リポジトリの境界

このリポジトリは、ブログのアプリケーション、コンテンツ、ワークロード用インフラストラクチャを管理します。

AWS Organizations全体の共通基盤(監査ログの一元管理、IAM Access Analyzer、Service Control Policyなど)は、ライフサイクルとfailure domainが異なるため、別のリポジトリで管理します。

## CDK naming policy

### Stack names

`stackName`は原則として指定しない。

Stackは`App`直下に配置し、Construct IDから生成されるCloudFormation Stack名を使用する。

### Construct IDs

Construct IDはPascalCaseで、resourceの責務を表す安定した名前にする。

Construct IDはCloudFormation Logical IDの生成に影響するため、deploy後は安易に変更しない。

### Physical resource names

`bucketName`、`roleName`、`distributionId`などのphysical nameは、外部interfaceとして固定する必要がある場合を除き指定しない。

AWS CDKとCloudFormationによる自動生成を優先する。

### Exceptions

次の場合のみphysical nameの明示を検討する。

- AWS外部のsystemから名前で参照される
- cross-account policyで安定した名前が必要
- service仕様上、名前による参照が不可避
- 運用手順に安定したidentifierが必要

明示する場合は、理由をADRまたはcode commentに記録する。

## ディレクトリ構成の設計

CDK applicationは`infra/`ディレクトリに配置し、リポジトリ直下とは独立したnpm projectとする。

将来ブログ本体のアプリケーション(SSGやサーバーサイドアプリケーションなど)を追加する場合は、`infra/`と衝突しない別ディレクトリに配置する。これにより、アプリケーションのビルドツールチェーンとCDKのビルドツールチェーンが互いに依存関係やlockfileを汚染しない。

リポジトリ直下は、Biomeやlefthookなど、リポジトリ全体に関わる開発ツールの設定だけを持つ。

## 今後の実装方針

現時点では、`cdk init`が生成した最小限のCDK applicationのみが存在する。

具体的なブログ配信用のリソース(S3、CloudFront、Route 53など)、環境ごとの設定の受け渡し方法、GitHub ActionsからのOIDCデプロイフローは、実際にブログアプリケーションを配置する際に段階的に設計・追加する。

使用されていないStack、Construct、設定ファイルは先行して作成しない。
