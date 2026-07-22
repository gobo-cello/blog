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
- `deploy.yml`: `main`へのmerge後、`sandbox` job(GitHub Environment `sandbox`、承認ルールなし)がSandbox用stackを自動deployする。`production` job(GitHub Environment `production`、Required Reviewers)は`needs: sandbox`で`sandbox` jobの成功に依存し、承認後にProduction用stackをdeployする。

1つのworkflow内で`needs:`により`sandbox` job → `production` job の順序を保証している。これにより、Sandboxへのdeployが失敗した場合はProduction jobがそもそも実行されず、Required Reviewersの承認さえ通ればdeployできてしまう、という抜け道を防ぐ。両jobは同じworkflow実行内にあるため、checkoutされるcommitも自然に同一になる(将来e2eテストのjobを追加する場合も、`production`の`needs`をそのjobに差し替えるだけでよい)。

設計判断の詳細な経緯は[ADR 0002](./adr/0002-github-actions-oidc-deploy.md)を参照。

## DNSと証明書

`blog.gobo-cello.com`のhosted zoneと、CloudFront用のACM証明書を`ProductionDnsStack`(`infra/lib/stacks/dns-stack.ts`)で管理する。

```text
gobo-cello.com (apex hosted zone、aws-platformが管理)
  └─ NS delegation → blog.gobo-cello.com (blog-productionが所有するhosted zone)
                        └─ ACM証明書(DNS検証、同じhosted zone内で完結)
```

apex hosted zoneは`aws-platform`リポジトリが管理し、`blog.gobo-cello.com`はNS delegationで委譲を受ける。証明書のDNS検証は、このリポジトリが所有する`blog.gobo-cello.com`のhosted zone内だけで完結するため、aws-platform側との追加のやり取りは不要である(初回のname server受け渡しを除く)。

### なぜus-east-1で証明書を作るか

CloudFrontにアタッチするACM証明書は、AWSの仕様上`us-east-1`でしか発行できない。`blog-production`accountの他のstackは`ap-northeast-1`を使うが、`ProductionDnsStack`だけは明示的に`env.region: "us-east-1"`を指定する。Route 53 Hosted ZoneはRegionを持たないglobal serviceなので、同じstackへ含めても問題ない。将来CloudFrontを追加する際の手戻り(証明書の作り直し)を避けるため、最初からこのregionで作成する。

### DNSSECは見送る

apex側の判断(ADR参照)と同じ理由により、このリポジトリ側でも設定しない。

## ブログアプリケーションの実装方式

ブログ本体は`app/`ディレクトリにAstro(静的サイト生成)で実装する。`infra/`とは独立したnpm projectとし、互いのビルドツールチェーンやlockfileを汚染しない。

設計判断の詳細な経緯は[ADR 0004](./adr/0004-blog-implementation-approach.md)を参照。

### ディレクトリ構成

```text
app/
├── src/
│   ├── content/
│   │   └── blog/
│   │       └── <slug>/
│   │           ├── index.md   # frontmatter + 本文
│   │           └── *.jpg,png  # colocateされた画像
│   ├── content.config.ts      # content collectionのschema定義(Zod)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       ├── index.astro
│       ├── posts/[slug].astro
│       ├── categories/[category].astro
│       ├── tags/[tag].astro
│       ├── rss.xml.ts
│       └── 404.astro
└── scripts/
    └── check-unused-images.ts # 記事から未参照の画像を検出するCIチェック
```

記事は`src/content/blog/<slug>/index.md`に、Astro 6以降のContent Layer API(`defineCollection` + `glob()` loader)で読み込む。`index.md`を持つディレクトリ名がそのままURLのslugになる。画像は記事ディレクトリにcolocationし、`public/`ではなく`src/`配下に置くことでAstroのビルド時最適化(`astro:assets`)を効かせる。

frontmatter schema: `title`・`description`・`date`・`category`(単一の主分類)・`tags`(複数可)・`cover`(colocated画像への相対パス)・`draft`。

### URL設計

- 記事: `/posts/<slug>/`
- カテゴリ別アーカイブ: `/categories/<category>/`
- タグ別アーカイブ: `/tags/<tag>/`
- RSS: `/rss.xml`(`@astrojs/rss`)
- サイトマップ: `/sitemap-index.xml`(`@astrojs/sitemap`)

ドメイン自体が`blog.gobo-cello.com`であるため、`/blog/`のようなprefixは付けない。

### 画像管理

画像は通常のgitで記事とともにコミットする(Git LFSや外部ストレージは使わない)。不要画像は`app/scripts/check-unused-images.ts`でCI検出する。

### テストとツールチェーン

`app/`はAstroがViteネイティブであることから、`infra/`のJestとは別にVitestを使う。型チェックに使う`@astrojs/check`のpeer dependency制約により、`app/`のTypeScriptは`infra/`より低いバージョン(6系)に留める。

## 今後の実装方針

具体的なブログ配信用のリソース(S3、CloudFrontなど)は、実際にブログアプリケーションを配置する際に段階的に設計・追加する。`ProductionDnsStack`が持つhosted zone・証明書は、その際にCloudFrontディストリビューションから参照される想定である。

使用されていないStack、Construct、設定ファイルは先行して作成しない。
