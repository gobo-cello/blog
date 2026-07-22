# 0003: blog.gobo-cello.comのhosted zoneと証明書

- Status: Accepted
- Date: 2026-07-22

## Context

`gobo-cello.com`はお名前.comで登録済みで、apex hosted zoneは
`aws-platform`リポジトリがManagement accountに作成する(ADR参照:
`aws-platform`リポジトリの`docs/adr/0005-dns-delegation.md`)。

ブログは`blog-production` account上で`blog.gobo-cello.com`として
公開する。将来的にはCloudFrontによる配信を予定しており、
CloudFrontにアタッチするACM証明書は`us-east-1`でしか発行できない
というAWSの制約がある。

## Decision

### ドメイン名は`blog.gobo-cello.com`とする

apex(`gobo-cello.com`)は今回使用せず、将来別のサブドメインが
増える余地として空けておく。

### hosted zoneはblog-production accountが所有する

`blog.gobo-cello.com`のhosted zoneは、このリポジトリのCDKで
`blog-production` accountに作成する。apex hosted zoneからNS
delegationを受けることで、証明書のDNS検証を含め、このリポジトリが
完全に自己完結して管理できる。

### 証明書はus-east-1で作成する

CloudFrontにアタッチするACM証明書はus-east-1でしか発行できない。
将来CloudFrontを追加する際の証明書作り直しという高コストな
手戻りを避けるため、`ProductionDnsStack`は最初から
`env.region: "us-east-1"`で作成する。

Route 53 Hosted ZoneはRegionを持たないglobal serviceであるため、
証明書と同じstack・同じregionにまとめても支障はない。

### DNSSECは見送る

apex側([aws-platformのADR 0005](../../../aws-platform/docs/adr/0005-dns-delegation.md)相当の判断)と同じ理由により、
このリポジトリ側でも設定しない。

## Consequences

- `blog-production` accountは、既存の`ap-northeast-1`に加えて
  `us-east-1`でもCDK bootstrapが必要になる。
- 証明書のDNS検証は、apex hosted zoneからのNS delegationが
  実際に反映されるまで完了しない。そのため、初回deployは
  「aws-platform側でapex hosted zoneをdeploy → お名前.comの
  ネームサーバー変更 → このリポジトリのhosted zoneをdeploy →
  aws-platform側へname serverを渡してdelegationレコードを追加」
  という順序を1回だけ手動で踏む必要がある(詳細はREADME参照)。
- 将来`sandbox.blog.gobo-cello.com`(フェーズG)を追加する場合は、
  `blog.gobo-cello.com`のhosted zoneから`blog-sandbox` accountへ
  同じNS delegationパターンを一段再帰させ、`blog-sandbox`が
  独自にhosted zone・証明書を持つ設計にする。今回のコード変更は
  productionのみで、sandbox用のstackは追加していない。
