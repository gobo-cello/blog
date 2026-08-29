import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { useEffect, useMemo, useState } from "react";

interface FlatHeading {
	id: string;
	value: string;
	depth: number;
}

function flattenHeadings(toc: Toc): FlatHeading[] {
	const headings: FlatHeading[] = [];
	const walk = (entries: Toc): void => {
		for (const entry of entries) {
			if ((entry.depth === 2 || entry.depth === 3) && entry.id) {
				headings.push({ id: entry.id, value: entry.value, depth: entry.depth });
			}
			if (entry.children) {
				walk(entry.children);
			}
		}
	};
	walk(toc);
	return headings;
}

// 見出しが読了ライン(ビューポート上端から READ_LINE_PX)を通過したら、
// その見出しを現在地としてハイライトする。
const READ_LINE_PX = 100;

export default function TableOfContents({ toc }: { toc: Toc }) {
	const headings = useMemo(() => flattenHeadings(toc), [toc]);
	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		if (headings.length === 0) {
			return;
		}
		const elements = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((element): element is HTMLElement => element !== null);

		const updateActive = (): void => {
			let current: string | null = null;
			for (const element of elements) {
				if (element.getBoundingClientRect().top <= READ_LINE_PX) {
					current = element.id;
				}
			}
			setActiveId(current);
		};

		updateActive();
		window.addEventListener("scroll", updateActive, { passive: true });
		return () => window.removeEventListener("scroll", updateActive);
	}, [headings]);

	if (headings.length === 0) {
		return null;
	}

	return (
		<aside className="hidden lg:sticky lg:top-8 lg:block lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
			<p className="text-sm font-bold text-foreground">目次</p>
			<ul className="mt-3 list-none space-y-1 border-l border-border p-0 text-sm">
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							className={`-ml-px block border-l-2 py-1 no-underline ${
								heading.depth === 3 ? "pl-6" : "pl-3"
							} ${
								heading.id === activeId
									? "border-accent font-medium text-accent"
									: "border-transparent text-muted hover:text-accent"
							}`}
						>
							{heading.value}
						</a>
					</li>
				))}
			</ul>
		</aside>
	);
}
