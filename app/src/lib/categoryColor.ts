import type { Category } from "../content.config";

/**
 * Tailwind は class 名を静的にしか検出できないため、
 * `bg-category-${category}` のような動的結合ではなく、
 * カテゴリごとの class 名をリテラルで列挙する。
 */
export const CATEGORY_COLOR_CLASS: Record<
	Category,
	{ dot: string; border: string; text: string }
> = {
	agile: {
		dot: "bg-category-agile",
		border: "border-category-agile",
		text: "text-category-agile",
	},
	tech: {
		dot: "bg-category-tech",
		border: "border-category-tech",
		text: "text-category-tech",
	},
	meta: {
		dot: "bg-category-meta",
		border: "border-category-meta",
		text: "text-category-meta",
	},
};
