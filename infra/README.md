# infra

このディレクトリは、ブログのワークロード用 Infrastructure as Code (AWS CDK) を管理する CDK application です。

このリポジトリ全体の目的、管理対象、公開リポジトリとしての取り扱いについては、リポジトリルートの [README.md](../README.md) を参照してください。

## よく使うコマンド

依存関係をインストールします。

```sh
npm ci
```

TypeScriptの型チェックを行います。

```sh
npm run build
```

テストを実行します。

```sh
npm test
```

CloudFormation templateを生成します。

```sh
npx cdk synth
```

デプロイします。

```sh
npx cdk deploy
```

デプロイ済みのStackと現在のコードの差分を確認します。

```sh
npx cdk diff
```
