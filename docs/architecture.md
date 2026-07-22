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

## GitHub ActionsとAWSの接続

GitHub ActionsからAWSへは、OIDCによる一時認証だけを使用する。長期的なAWS access keyは発行しない。

### Trust chain

```text
GitHub Actions (OIDC token)
  └─ AssumeRoleWithWebIdentity
      └─ GithubDeployRole (Sandbox / Production、account毎)
          └─ CloudFormation (cdk deploy)
              └─ CDK Bootstrap Execution Role (cdk-hnb659fds-cfn-exec-role-*)
```

`GithubDeployRole`自体には具体的なAWS resourceへの権限を持たせない。許可するのは、CDK bootstrapが管理する`deploy-role`・`file-publishing-role`・`lookup-role`への`sts:AssumeRole`だけである。実際のCloudFormation操作は、bootstrapの`cfn-exec-role`が行う。GitHub Actionsは認証だけを担い、権限の実体はCDK bootstrapの仕組みに委ねる。

### OIDC Providerとroleはaccount単位

`blog-sandbox`account、`blog-production`accountそれぞれに、IAM OIDC Provider(`AWS::IAM::OIDCProvider`)と専用のDeploy Roleを1つずつ作成する。共通の1つのroleにはしない。Trust PolicyやPermissionが環境ごとに異なりうること、事故発生時の影響範囲を環境単位に限定できることが理由である。

### Trust conditionはGitHub Environment単位

Trust policyの`sub`claimは、workflow名やbranch名ではなく、GitHub Environment名で絞り込む。

```text
repo:gobo-cello/blog:environment:sandbox
repo:gobo-cello/blog:environment:production
```

`aud`claimは`sts.amazonaws.com`に固定する。workflow名で絞り込まない理由は、workflowをリネームしてもtrust policyの更新が不要になるためである。GitHub Environmentは、Required Reviewersなどのデプロイ承認ルールとも自然に対応する。

### Stack命名規則とworkflowの対応

Stack IDは`Sandbox*` / `Production*`のprefixで、deploy先accountを表す。GitHub Actionsのworkflowは、対応するprefixのstackだけをstack selectorで指定してdeployする(例: `cdk deploy SandboxGithubDeployRoleStack`)。将来追加するホスティング用stackも、この命名規則に従う。

### Workflow構成

- `pr-ci-gate.yml`: Pull Requestで`biome`・`build`・`jest`・`cdk synth`・`cdk diff`(sandbox environmentのcredentialを使用)を実行する。
- `deploy-sandbox.yml`: `main`へのmerge後、GitHub Environment `sandbox`(承認ルールなし)でSandbox用stackを自動deployする。
- `deploy-production.yml`: `deploy-sandbox.yml`の完了を`workflow_run`でtriggerとし、`conclusion == 'success'`の場合だけ実行する。GitHub Environment `production`(Required Reviewers)で承認付きdeployし、`deploy-sandbox.yml`と同じcommit(`github.event.workflow_run.head_sha`)をdeployする。

`deploy-production.yml`を`push`ではなく`workflow_run`にしているのは、Sandboxへのdeployが成功したcommitだけをProductionへ昇格させるためである。両workflowを同じ`push`で独立にtriggerすると、Sandboxが失敗していてもProductionの承認さえ通ればdeployが進んでしまう。

設計判断の詳細な経緯は[ADR 0002](./adr/0002-github-actions-oidc-deploy.md)を参照。

## 今後の実装方針

具体的なブログ配信用のリソース(S3、CloudFront、Route 53など)は、実際にブログアプリケーションを配置する際に段階的に設計・追加する。

使用されていないStack、Construct、設定ファイルは先行して作成しない。
