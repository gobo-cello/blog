import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("categories/:category", "routes/category.tsx"),
	route("posts/:slug", "routes/post.tsx"),
	route("tags/:tag", "routes/tag.tsx"),
	route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
