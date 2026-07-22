# 0002: GitHub ActionsからAWSへのOIDCデプロイ設計

- Status: Accepted
- Date: 2026-07-22

## Context

GitHub ActionsからAWS(`blog-sandbox` / `blog-production`account)へCDK deployできる状態を作る必要がある。長期的なAWS access keyは発行しない方針であり、OIDCによる一時認証を使用する。

設計にあたり、次の分岐点を検討した。

## Decision

### 全体構成: 4層構成

GitHub Actionsは認証だけを担う。実際のリソース変更はCloudFormationとCDK bootstrapのexecution roleが行う。

```text
GitHub Actions → AssumeRoleWithWebIdentity → GithubDeployRole
  → CloudFormation → CDK Bootstrap Execution Role → AWS Resources
```

`GithubDeployRole`は、CDK bootstrapの`deploy-role`・`file-publishing-role`・`lookup-role`への`sts:AssumeRole`だけを許可し、具体的なAWS resourceへの権限は一切持たない。

### ① OIDC Providerの配置単位: account毎に作成する

Deploy先の`blog-sandbox` / `blog-production`accountそれぞれにOIDC Providerを作成する。Management account経由のAssumeRoleは行わない。Deploy先account自身が認証を持つ方が単純であるため。

### ② Deploy Roleを分けるか: 環境ごとに2つ作成する

`SandboxGithubDeployRole` / `ProductionGithubDeployRole`の2つを作成し、共通の1つのroleにはしない。EnvironmentごとにPermissionが変わりうること、事故時の影響範囲を限定できることが理由である。

### ③ branch制限: GitHub Environmentベースにする

Trust policyの`sub`claimは、branch名やtag名ではなく、GitHub Environment名(`environment:sandbox` / `environment:production`)で絞り込む。GitHub Environmentで保護する方が、GitHub側の運用(Required Reviewersなど)と一致するため。

### ④ Repository制限の粒度: repository + environmentまでとする

OIDC trust conditionには`repository`・`environment`までを含め、`workflow`名までは固定しない。workflowをリネームするとrole trust policyの更新が必要になり、運用上の負担が大きいため。

### ⑤ Bootstrap Roleを直接使うか: 独自のDeploy Roleを作る

CDK bootstrapの`deploy-role`をGitHubから直接trustさせるのではなく、独自の`GithubDeployRole`を作り、そこから bootstrap roleをassumeする構成にする。Bootstrap更新時の影響を、GitHub側のtrust policyから分離できるため。

### ⑥ Sandboxのデプロイ契機: main mergeで自動デプロイ

Pull Requestでは`build`・`test`・`biome`・`cdk synth`・`cdk diff`のみを実行し、実際のdeployは`main`へのmerge後に自動実行する。

### ⑦ Production承認: GitHub Environmentで行う

CodePipelineなどAWS側の承認機構ではなく、GitHub EnvironmentのRequired Reviewersを使う。レビュー導線をGitHubへ集約するため。

### ⑧ PRで確認する範囲: synthとdiffの両方

PRでは`cdk synth`(ダミーaccount IDによる型・構文チェック)と`cdk diff`(実sandbox accountに対する実際の差分確認)の両方を実行する。

### ⑨ Workflowの分割数: 2つの責務に分ける

`pr-ci-gate.yml`(PR CI + diff)と`deploy.yml`(deploy)の2workflowに分ける。既存の`pr-ci-gate.yml`がPR CIの役割を兼ねるため、新たに`ci.yml`は作成しない。

### ⑩ SandboxとProductionの依存関係: 同一workflow内の`needs:`で直列化する

`deploy.yml`の`sandbox` jobと`production` jobを別workflowに分け`workflow_run`で繋ぐ案も検討したが、採用しなかった。理由は次のとおりである。

- `workflow_run`はdefault branch(`main`)上のworkflow定義を使ってtriggerされるため、依存関係の変更がmainへmergeされるまでの間、挙動が不安定になる
- deploy対象のcommitを`github.event.workflow_run.head_sha`で明示的に揃える必要があり、実装が複雑になる
- 2つのworkflow実行に分かれるため、Actionsタブでパイプライン全体の状態を一目で確認しづらい

代わりに、1つの`deploy.yml`workflow内に`sandbox` jobと`production` jobを作り、`production: needs: sandbox`で依存させる。これにより、Sandboxへのdeployが失敗した場合はProduction jobがそもそも実行されず、Required Reviewersの承認さえ通ればdeployが進んでしまう、という抜け道を防ぐ。同一workflow実行のため、checkoutされるcommitも自然に同一になる。将来e2eテストのjobを追加する場合は、`e2e-test: needs: sandbox`、`production: needs: e2e-test`のようにneeds chainを差し替えるだけでよい。

## Consequences

- `GithubDeployRoleStack`の初回deployは、GitHub Actions自身が自分のtrust関係をdeployすることができない(chicken-and-egg)ため、人がローカルのAdministratorAccess権限で`cdk bootstrap`・初回`cdk deploy`を実行する必要がある。
- Deploy Role ARNやaccount IDはsecretではないが、production環境のRole ARNをGitHub Environment `production`のVariableとして登録することで、Required Reviewersの承認ゲートの内側に自然に組み込まれる。
- 将来ホスティング用stackを追加する場合も、`Sandbox*` / `Production*`のstack命名規則と、対応するworkflowのstack selectorを踏襲する。
- `sandbox` jobと`production` jobが同一workflowにあるため、`production`のRequired Reviewers承認待ちの間も`sandbox` jobの実行結果と合わせて1つのworkflow実行として状態を追える。
