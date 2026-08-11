import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "../src/lib/site-url";

describe("resolveSiteUrl", () => {
	it("ドメイン名から https の origin を組み立てる", () => {
		expect(resolveSiteUrl("blog.example.com")).toBe("https://blog.example.com");
	});

	it("ドメイン名が未指定なら例外を投げる", () => {
		expect(() => resolveSiteUrl(undefined)).toThrow(
			"BLOG_DOMAIN_NAME environment variable is required",
		);
	});

	it("ドメイン名が空文字なら例外を投げる", () => {
		expect(() => resolveSiteUrl("")).toThrow(
			"BLOG_DOMAIN_NAME environment variable is required",
		);
	});
});
