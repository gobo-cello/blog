import { Link } from "react-router";
import type { Post } from "../content/schema";
import CategoryBadge from "./CategoryBadge";
import Title from "./Title";

interface PostListProps {
	posts: Post[];
	showCategory?: boolean;
}

export default function PostList({
	posts,
	showCategory = true,
}: PostListProps) {
	return (
		<ul className="mt-4 list-none divide-y divide-border p-0">
			{posts.map((post) => (
				<li key={post.slug} className="py-4 first:pt-0">
					<Link
						to={`/posts/${post.slug}`}
						prefetch="intent"
						className="text-lg font-semibold text-foreground no-underline hover:text-accent"
					>
						<Title title={post.title} />
					</Link>
					<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
						<p>{post.date.toISOString().slice(0, 10)}</p>
						{showCategory && (
							<>
								<span aria-hidden="true">·</span>
								<CategoryBadge category={post.category} />
							</>
						)}
						{post.tags.length > 0 && (
							<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
								{post.tags.map((tag) => (
									<li key={tag}>
										<Link
											to={`/tags/${tag}`}
											prefetch="intent"
											className="rounded-full border border-border px-3 py-1 text-sm text-muted no-underline hover:border-accent hover:text-accent"
										>
											#{tag}
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				</li>
			))}
		</ul>
	);
}
