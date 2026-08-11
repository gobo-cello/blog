import { describe, expect, it } from "vitest";
import { resolveCodeBlockTitle } from "../src/lib/code-block-title";

describe("resolveCodeBlockTitle", () => {
	it("title が未指定なら言語名をタイトルにする", () => {
		expect(resolveCodeBlockTitle(undefined, "yaml")).toBe("yaml");
	});

	it("title が指定されていればそのまま優先する", () => {
		expect(resolveCodeBlockTitle("dependabot-auto-merge.yml", "yaml")).toBe(
			"dependabot-auto-merge.yml",
		);
	});

	it("title も言語も未指定なら未指定のままにする", () => {
		expect(resolveCodeBlockTitle(undefined, undefined)).toBeUndefined();
	});

	it("title が空文字なら言語名で補う", () => {
		expect(resolveCodeBlockTitle("", "yaml")).toBe("yaml");
	});
});
