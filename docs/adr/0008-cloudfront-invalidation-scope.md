# 0008: CloudFront invalidation対象の絞り込み

- Status: Accepted
- Date: 2026-07-25

## Context

[ADR 0006](./0006-static-site-hosting.md)で決めた`StaticSiteHosting`は、`BucketDeployment`の`distributionPaths: ["/*"]`により、デプロイの度にCloudFront配信の全パスをinvalidationしていた。

Astroのビルド出力(`app/dist`)には2種類のファイルが混在する。

- `_astro/`配下のJS・CSS・画像などのバンドルアセットは、内容に応じたコンテンツハッシュがファイル名に付与される(例: `_astro/BaseLayout.DWJMoTJK.css`)。内容が変われば新しいパスになるため、同一パスのままキャッシュ内容が古くなることはない。
- `index.html`や`posts/<slug>/index.html`などのHTMLファイル、`sitemap*.xml`、`favicon.ico`などは、ビルドを跨いでも同じパスのまま内容だけが更新される。

`/*`の一括invalidationは、実際には壊れる原因そのものではない。invalidationはCloudFrontエッジのキャッシュを破棄し次回アクセス時にオリジン(S3)へ再取得させるだけであり、S3にオブジェクトが残っていれば実害はない。実際に問題を起こすのは`BucketDeployment`のデフォルト`prune: true`によるS3側の削除であり、これは新しいビルドに含まれない古いハッシュ付きアセットを消してしまう。

この状態で`_astro/*`もまとめてinvalidationすると、次のような順序で古いHTMLを見ているクライアントに影響し得る。

1. デプロイでS3の旧ハッシュアセットがpruneされる。
2. 同じデプロイでCloudFrontの`_astro/*`を含む全パスがinvalidationされる。
3. 古いHTML(旧デプロイ時にブラウザへ配信済みのページ)を開いたままのクライアントが、旧ハッシュ付きURLで`_astro/*`のアセットへ再アクセスすると、エッジキャッシュが破棄済み・オリジンも削除済みのため403(→404にマッピング)になる。

invalidation対象から`_astro/*`を外せば、エッジキャッシュがまだ残っている間(現状のdefault cache policyでは最大1日)は、S3から既に削除済みであっても新規のオリジンアクセスが発生せずエッジ側で返せるため、上記3のタイミングで壊れる可能性を下げられる。

## Decision

### `distributionPaths`を、ハッシュの付かないファイルのパスに絞る

`_astro/`配下を除く`siteContentPath`直下のエントリから、invalidation対象パスを合成する。ディレクトリは`/<name>/*`、ファイルは`/<name>`として列挙し、`_astro`ディレクトリ自体は対象に含めない(`static-site-hosting.ts`の`nonHashedAssetInvalidationPaths`)。

このリストはCDK synth時に`siteContentPath`(実体は`app/dist`)を`readdirSync`で読んで動的に算出する。`posts/`や`tags/`のような具体的なルート名をハードコードで列挙しない。新しいトップレベルのルートが増えても、除外対象は「ハッシュ付きアセットの出力先である`_astro/`」という1点だけで、それ以外は自動的にinvalidation対象へ含まれ続けるため、列挙漏れによる放置(古いHTMLがinvalidationされないまま残り続ける)のリスクを避けられる。

### S3側のprune(削除)は変更しない

`BucketDeployment`の`prune`はデフォルト(`true`)のままとし、変更しない。古いハッシュ付きアセットをS3側で一定期間保持する設計(例: prune除外や世代管理)も検討したが、実装・運用コストに対して、まずは低コストな「invalidation対象を絞るだけ」を試す判断とした。

## Consequences

- この対策はあくまで簡易的なフォールバックであり、完全な保証ではない。エッジキャッシュに当該アセットが残っていない(TTL切れ・キャッシュミス・未アクセスのエッジロケーションなど)場合は、S3側で既にpruneされていれば従来どおり403(→404)になる。
- `_astro/*`への影響が小さい代わりに、キャッシュTTLが残っている間は更新後のCSS/JSが一部クライアントに古いまま配信され続ける可能性がある。ただし`_astro/`配下はコンテンツハッシュ付きのため、これは「同一URLが指す内容が変わる」ことはなく、単に「新しいHTMLが参照する新しいハッシュ付きURLへの更新が、旧HTMLを開いたままのタブには届かない」だけであり、実害は小さいと判断した。
- より確実な解決(古いハッシュ付きアセットをS3側で一定期間保持する、あるいはHTML自体のキャッシュTTLを短縮する等)が必要になった場合は、本ADRを更新するか、新しいADRを起こして再検討する。
