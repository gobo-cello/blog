import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
	{ title: "404 Not Found" },
	{ name: "description", content: "ページが見つかりませんでした。" },
];

export default function NotFound() {
	return (
		<>
			<h1>404</h1>
			<p>ページが見つかりませんでした。</p>
			<a href="/">トップページへ戻る</a>
		</>
	);
}
