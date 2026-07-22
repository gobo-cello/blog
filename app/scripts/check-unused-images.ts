import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const imageExtensions = [
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".webp",
	".avif",
];

function isImageFile(fileName: string): boolean {
	return imageExtensions.some((extension) =>
		fileName.toLowerCase().endsWith(extension),
	);
}

export function findUnusedImages(blogContentDir: string): string[] {
	const unusedImagePaths: string[] = [];

	for (const entryName of readdirSync(blogContentDir)) {
		const entryPath = join(blogContentDir, entryName);
		if (!statSync(entryPath).isDirectory()) {
			continue;
		}

		const files = readdirSync(entryPath);
		if (!files.includes("index.md")) {
			continue;
		}

		const markdownContent = readFileSync(join(entryPath, "index.md"), "utf-8");
		const imageFiles = files.filter((file) => isImageFile(file));

		for (const imageFile of imageFiles) {
			if (!markdownContent.includes(imageFile)) {
				unusedImagePaths.push(join(entryPath, imageFile));
			}
		}
	}

	return unusedImagePaths;
}

const isMainModule =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
	const blogContentDir = join(
		import.meta.dirname,
		"..",
		"src",
		"content",
		"blog",
	);
	const unusedImagePaths = findUnusedImages(blogContentDir);

	if (unusedImagePaths.length > 0) {
		console.error("未参照の画像が見つかりました:");
		for (const imagePath of unusedImagePaths) {
			console.error(`  ${imagePath}`);
		}
		process.exit(1);
	}

	console.log("未参照の画像はありませんでした。");
}
