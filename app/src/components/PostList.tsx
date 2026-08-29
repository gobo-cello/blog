import type { Post } from "../content/schema";
import { renderTitleHtml } from "../lib/title";
import CategoryBadge from "./CategoryBadge";

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
					<a
						href={`/posts/${post.slug}/`}
						className="text-lg font-semibold text-foreground no-underline hover:text-accent"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: renderTitleHtml は HTML エスケープ済みの文字列を返す
						dangerouslySetInnerHTML={{
							__html: renderTitleHtml(post.data.title),
						}}
					/>
					<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
						<p>{post.data.date.toISOString().slice(0, 10)}</p>
						{showCategory && (
							<>
								<span aria-hidden="true">·</span>
								<CategoryBadge category={post.data.category} />
							</>
						)}
						{post.data.tags.length > 0 && (
							<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
								{post.data.tags.map((tag) => (
									<li key={tag}>
										<a
											href={`/tags/${tag}/`}
											className="rounded-full border border-border px-3 py-1 text-sm text-muted no-underline hover:border-accent hover:text-accent"
										>
											#{tag}
										</a>
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
