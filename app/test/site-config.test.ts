import { describe, expect, it } from "vitest";
import { resolveSiteConfig } from "../src/config/site";

describe("resolveSiteConfig", () => {
	it("BLOG_DOMAIN_NAME から https の siteUrl を組み立てる", () => {
		const config = resolveSiteConfig({ BLOG_DOMAIN_NAME: "blog.example.com" });

		expect(config.blogDomainName).toBe("blog.example.com");
		expect(config.siteUrl).toBe("https://blog.example.com");
	});

	it("BLOG_DOMAIN_NAME が未設定なら例外を投げる", () => {
		expect(() => resolveSiteConfig({})).toThrow(
			"BLOG_DOMAIN_NAME environment variable is required",
		);
	});

	it("BLOG_DOMAIN_NAME が空文字なら例外を投げる", () => {
		expect(() => resolveSiteConfig({ BLOG_DOMAIN_NAME: "" })).toThrow(
			"BLOG_DOMAIN_NAME environment variable is required",
		);
	});

	it("APEX_DOMAIN_NAME が未設定なら example.com にフォールバックする", () => {
		const config = resolveSiteConfig({ BLOG_DOMAIN_NAME: "blog.example.com" });

		expect(config.apexDomainName).toBe("example.com");
		expect(config.apexUrl).toBe("https://example.com");
	});

	it("APEX_DOMAIN_NAME が指定されていればその値を使う", () => {
		const config = resolveSiteConfig({
			BLOG_DOMAIN_NAME: "blog.example.com",
			APEX_DOMAIN_NAME: "gobo-cello.example",
		});

		expect(config.apexDomainName).toBe("gobo-cello.example");
		expect(config.apexUrl).toBe("https://gobo-cello.example");
	});
});
