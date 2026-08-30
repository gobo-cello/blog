import { Link } from "react-router";
import type { Category } from "../content/schema";
import { CATEGORY_COLOR_CLASS } from "../lib/categoryColor";

export default function CategoryBadge({ category }: { category: Category }) {
	return (
		<Link
			to={`/categories/${category}`}
			prefetch="intent"
			className="flex items-center gap-1.5 text-muted no-underline hover:text-accent"
		>
			<span
				aria-hidden="true"
				className={`inline-block h-2 w-2 rounded-full ${CATEGORY_COLOR_CLASS[category].dot}`}
			/>
			{category}
		</Link>
	);
}
