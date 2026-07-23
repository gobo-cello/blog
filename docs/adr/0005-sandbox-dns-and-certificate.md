# 0005: sandbox.blog.gobo-cello.comのhosted zoneと証明書

- Status: Accepted
- Date: 2026-07-23

## Context

[ADR 0003](./0003-dns-and-certificate.md)は、将来`sandbox.blog.gobo-cello.com`(ロードマップG: Sandbox環境構築)を追加する場合の設計方針をあらかじめ決めていた。`blog.gobo-cello.com`のhosted zoneから`blog-sandbox` accountへ同じNS delegationパターンを一段再帰させ、`blog-sandbox`が独自にhosted zone・証明書を持つ、というものである。今回、ロードマップGの一環としてこれを実装する。

## Decision

### ドメイン名は`sandbox.blog.gobo-cello.com`とする

ADR 0003の想定どおり、`blog.gobo-cello.com`のサブドメインとする。

### hosted zoneはblog-sandbox accountが所有する

`sandbox.blog.gobo-cello.com`のhosted zoneは、`SandboxDnsStack`(`infra/lib/stacks/sandbox-dns-stack.ts`)として`blog-sandbox` accountに作成する。`blog-production` accountが持つ`blog.gobo-cello.com`のhosted zoneからNS delegationを受けることで、証明書のDNS検証を含め、`blog-sandbox` account内で完結して管理できる。

### 証明書はus-east-1で作成する

`ProductionDnsStack`と同じ理由(CloudFrontにアタッチするACM証明書は`us-east-1`でしか発行できない)により、`SandboxDnsStack`も`env.region: "us-east-1"`で作成する。

### delegationは`DnsStack`(production)へのオプショナルpropで表現する

`DnsStack`(`blog.gobo-cello.com`のhosted zoneを持つ、production用stack)に`sandboxSubdomainNameServers?: readonly string[]`propを追加し、値が指定された場合のみ`sandbox`宛のNSレコードを作成する。これは`aws-platform`リポジトリの`DnsStack`が`blogSubdomainNameServers`propで`gobo-cello.com` apexから`blog.gobo-cello.com`への委譲を表現しているのと同型のパターンであり、apex→blog→sandboxという再帰的な委譲チェーンを一貫した設計で表現できる。

`sandboxSubdomainNameServers`は`SANDBOX_SUBDOMAIN_NAME_SERVERS`環境変数(カンマ区切り)からパースする。値が未設定の場合はNSレコードを作成しないため、`SandboxDnsStack`の初回deploy前でも`ProductionDnsStack`のdeployは失敗しない。

### DNSSECは見送る

ADR 0003・apex側の判断と同じ理由により、このstackでも設定しない。

## Consequences

- `blog-sandbox` accountは、既存の`ap-northeast-1`に加えて`us-east-1`でもCDK bootstrapが必要になる。
- 初回セットアップは、「`ProductionDnsStack`(既存、`sandboxSubdomainNameServers`未指定)をdeploy → `SandboxDnsStack`をdeployしてhosted zoneのname serverを得る → `SANDBOX_SUBDOMAIN_NAME_SERVERS`環境変数に設定して`ProductionDnsStack`を再deploy」という順序を1回だけ手動で踏む必要がある(詳細はREADME参照)。この手順は、apex hosted zoneと`blog.gobo-cello.com`の間で行った手順(ADR 0003)と同じ形の繰り返しである。
- `blog.gobo-cello.com` → `sandbox.blog.gobo-cello.com`のNS delegationチェーンが実際に追加され、ADR 0003で示した設計が実装された。
