# 0006: 静的サイトホスティングの実装方式

- Status: Accepted
- Date: 2026-07-23

## Context

[ADR 0004](./0004-blog-implementation-approach.md)は、ブログを静的サイト(S3+CloudFront)としてAstroで実装する方針を決めていたが、実際の配信インフラ(S3・CloudFrontなど)の設計はロードマップG・Hで行うとしていた。今回、ロードマップG-2として、Sandbox環境向けにこれを実装する。

`SandboxDnsStack`(ADR 0005)が持つ`sandbox.blog.gobo-cello.com`のhosted zoneとACM証明書を、実際にCloudFrontディストリビューションから参照する段階にあたる。

## Decision

### S3(private)+CloudFront(OAC)構成にする

配信用S3 bucketは`BlockPublicAccess.BLOCK_ALL`のprivate bucketとし、CloudFrontからはOrigin Access Control(OAC)経由でのみアクセスさせる。Origin Access Identity(OAI)は使わない。OACはAWSが推奨する後継機能であり、OAIは legacy 機能のためである。

### `BucketDeployment`でサイトコンテンツを同期し、GitHub Actions側で`aws s3 sync`は行わない

`docs/architecture.md`のTrust chain節が定めるとおり、`GithubDeployRole`自体には具体的なAWS resourceへの権限を持たせず、CDK bootstrapの`deploy-role`/`file-publishing-role`/`lookup-role`へのAssumeRoleだけを許可する設計にしている。GitHub Actionsが直接`aws s3 sync`でサイトコンテンツを同期する設計にすると、`GithubDeployRole`にS3への具体的な権限を追加する必要が生じ、このtrust chain設計を崩す。

`aws-s3-deployment`の`BucketDeployment`を使えば、実際のS3同期・CloudFront invalidationはCDKが管理するLambda(CDK bootstrapの`cfn-exec-role`経由で実行される)が行うため、`GithubDeployRole`への新規権限追加は不要になる。

### Sandbox・Productionで単一の共通Constructを再利用する

`infra/lib/constructs/static-site-hosting.ts`に`StaticSiteHosting` constructを実装し、S3 bucket・CloudFront Distribution・CloudFront標準アクセスログ用bucket・`BucketDeployment`・Route 53 aliasレコードをまとめて持たせる。`removalPolicy`/`autoDeleteObjects`・`domainName`・`hostedZone`・`certificate`・`siteContentPath`はpropsとして受け取り、環境固有の値を持たない。

これを`infra/lib/stacks/hosting-stack.ts`の`HostingStack`(`GithubDeployRoleStack`と同型の、1クラスをSandbox/Production両方のidでインスタンス化するパターン)から利用する。Sandboxで先に検証し、Productionでも同じConstruct・同じStackクラスをそのまま再利用する(ロードマップH-1)。

### 404は`app/src/pages/404.astro`のビルド後ファイルへマッピングする

CloudFrontの`errorResponses`で、HTTPステータス404を`/404.html`(Astroのビルド出力)へマッピングする。

## Consequences

- `HostingStack`の`siteContentPath`propは、実際にデプロイするビルド成果物のディレクトリ(`app/dist`)を呼び出し側(`infra/bin/infra.ts`)が指定する。Constructはリポジトリのディレクトリ構成を知らない。
- `BucketDeployment`は synth 時に`siteContentPath`が実在するディレクトリであることを要求するため、`infra/bin/infra.ts`へ`HostingStack`を実際に配線するタイミングは、GitHub Actionsのworkflowが`app`のビルド成果物を用意できるようになった後(ロードマップG-3)にする。G-2の時点ではConstruct・Stackクラスの実装とunit testに留め、unit testは実データの`app/dist`ではなく`infra/test/fixtures/static-site/`の小さなfixtureを使う。
- aws-cdk-libの`Bucket`が持つoptionalなgetter(`isWebsite`など)と、`infra`のtsconfigが有効にしている`exactOptionalPropertyTypes: true`の間に既知の型非互換があり、`static-site-hosting.ts`内で`IBucket`を要求するCDK APIへ渡す境界だけ、限定的に型キャストしている。
