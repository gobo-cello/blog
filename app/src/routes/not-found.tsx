import NotFound from "../components/NotFound";
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
	{ title: "404 Not Found" },
	{ name: "description", content: "ページが見つかりませんでした。" },
];

export default function NotFoundRoute() {
	return <NotFound />;
}
