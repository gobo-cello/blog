import type { ReactNode } from "react";
import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useMatches,
} from "react-router";
import "./styles/global.css";
import NotFound from "./components/NotFound";
import { plainTitle } from "./lib/title";

// ヘッダーから外部サイト(landing)へのリンク先ドメイン。値はビルド時の環境変数
// `VITE_APEX_DOMAIN_NAME` に由来し、Vite が `VITE_` プレフィックス付きの変数を
// `import.meta.env` 経由でクライアントバンドルへ自動的に露出する。未設定でも
// リンク先が変わるだけでページは壊れないため、安全な既定ドメインへフォールバック
// する。canonical URL を扱うサーバー側専用の src/config/site.ts とは別系統。
const apexDomainName = import.meta.env.VITE_APEX_DOMAIN_NAME || "example.com";

interface RouteHandle {
	wide?: boolean;
}

export function Layout({ children }: { children: ReactNode }) {
	const isWide = useMatches().some(
		(match) => (match.handle as RouteHandle | undefined)?.wide,
	);
	const containerClass = isWide
		? "mx-auto max-w-2xl px-4 lg:max-w-[60rem]"
		: "mx-auto max-w-2xl px-4";

	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width" />
				<link rel="icon" type="image/png" href="/favicon-32x32.png" />
				<link rel="icon" href="/favicon.ico" sizes="32x32" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link
					rel="alternate"
					type="application/rss+xml"
					title="ごぼうのブログ"
					href="/rss.xml"
				/>
				<Meta />
				<Links />
			</head>
			<body className="font-sans">
				<header className="border-b border-border">
					<div
						className={`flex items-center justify-between py-4 ${containerClass}`}
					>
						<Link
							to="/"
							prefetch="intent"
							className="text-foreground no-underline hover:text-accent"
						>
							ごぼうのブログ
						</Link>
						<a
							href={`https://${apexDomainName}`}
							className="text-foreground no-underline hover:text-accent"
						>
							gobo-cello
						</a>
					</div>
				</header>
				<main className={`py-8 ${containerClass}`}>{children}</main>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
	const is404 = isRouteErrorResponse(error) && error.status === 404;
	if (is404) {
		return <NotFound />;
	}
	return (
		<>
			<h1>エラー</h1>
			<p>予期しないエラーが発生しました。</p>
			<a href="/">トップページへ戻る</a>
		</>
	);
}

export const meta = () => [{ title: plainTitle("ごぼうのブログ") }];
