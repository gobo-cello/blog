# 0001: blog と組織共通基盤のリポジトリを分離する

- Status: Accepted
- Date: 2026-07-22

## Context

AWS organizationのplatformとblog workloadは、lifecycle、deployment target、failure domainが異なる。

platform側の変更(CloudTrail、IAM Access Analyzer、Service Control Policyなど組織横断の監査・セキュリティ基盤)は、blogのデプロイとは独立して行われる必要がある。

## Decision

blog applicationとそのworkload infrastructureは、`gobo-cello-blog`リポジトリで管理する。

organization-level infrastructure(AWS Organizations、Management account、CloudTrailなどの組織横断基盤)は、別の`gobo-cello-aws-platform`リポジトリで管理する。

## Consequences

- blogの障害はsecurityおよびloggingの変更をブロックしない。
- platformの変更はblogを自動的にdeployしない。
- 共有infrastructure(アカウント構成、監査ログ基盤など)は、リポジトリ間で明示的なinterfaceを必要とする。
- blogリポジトリのGitHub Actions用IAM roleは、blogリポジトリ専用のtrust policyを持ち、platformリポジトリのroleとは分離する。
