import type { ReactNode } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useMatches,
} from "react-router";
import "./styles/global.css";
import { plainTitle } from "./lib/title";

// vite.config.ts の define でビルド時に静的な文字列へ置き換えられる。
const apexDomainName = process.env.APEX_DOMAIN_NAME || "example.com";

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
						<a
							href="/"
							className="text-foreground no-underline hover:text-accent"
						>
							ごぼうのブログ
						</a>
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
	return (
		<>
			<h1>{is404 ? "404" : "エラー"}</h1>
			<p>
				{is404
					? "ページが見つかりませんでした。"
					: "予期しないエラーが発生しました。"}
			</p>
			<a href="/">トップページへ戻る</a>
		</>
	);
}

export const meta = () => [{ title: plainTitle("ごぼうのブログ") }];
