import type { Category } from "../content/schema";
import { CATEGORY_COLOR_CLASS } from "../lib/categoryColor";

interface CategoryTabsProps {
	categories: readonly Category[];
	active: Category | null;
}

const baseClass =
	"flex items-center gap-1.5 border-b-2 -mb-px px-1 pb-2 text-sm font-medium no-underline";
const inactiveClass =
	"border-transparent text-muted hover:border-border hover:text-foreground";

export default function CategoryTabs({
	categories,
	active,
}: CategoryTabsProps) {
	return (
		<nav
			aria-label="カテゴリ"
			className="mt-6 flex flex-wrap gap-4 border-b border-border"
		>
			<a
				href="/"
				aria-current={active === null ? "page" : undefined}
				className={`${baseClass} ${
					active === null ? "border-accent text-accent" : inactiveClass
				}`}
			>
				All
			</a>
			{categories.map((category) => {
				const isActive = active === category;
				const color = CATEGORY_COLOR_CLASS[category];
				return (
					<a
						key={category}
						href={`/categories/${category}/`}
						aria-current={isActive ? "page" : undefined}
						className={`${baseClass} ${
							isActive ? `${color.border} ${color.text}` : inactiveClass
						}`}
					>
						<span
							aria-hidden="true"
							className={`inline-block h-2 w-2 rounded-full ${color.dot}`}
						/>
						{category}
					</a>
				);
			})}
		</nav>
	);
}
