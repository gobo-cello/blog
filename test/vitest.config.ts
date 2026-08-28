import { defineConfig } from "vitest/config";

// config をリポジトリ直下ではなく test/ に置く。app/ など vitest config を
// 持たないサブパッケージの vitest が祖先方向へ探索したときに、この config を
// 誤って読み込んで壊れるのを防ぐため。include はリポジトリ root からの相対。
export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
	},
});
