import { describe, expect, it } from "vitest";
import { plainTitle, renderTitleHtml } from "../src/lib/title";

describe("renderTitleHtml", () => {
	it("バッククォートで囲まれた部分を code 要素に変換する", () => {
		expect(renderTitleHtml("`>/dev/null 2>&1` って何？")).toBe(
			"<code>&gt;/dev/null 2&gt;&amp;1</code> って何？",
		);
	});

	it("バッククォートを含まないタイトルはそのまま返す", () => {
		expect(renderTitleHtml("普通の記事タイトル")).toBe("普通の記事タイトル");
	});

	it("HTML として解釈されうる文字をエスケープする", () => {
		expect(renderTitleHtml('<script>alert("x")</script>')).toBe(
			"&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
		);
	});

	it("複数のコード区間を個別の code 要素に変換する", () => {
		expect(renderTitleHtml("`foo` と `bar` の違い")).toBe(
			"<code>foo</code> と <code>bar</code> の違い",
		);
	});
});

describe("plainTitle", () => {
	it("バッククォートを取り除いたプレーンテキストを返す", () => {
		expect(plainTitle("`>/dev/null 2>&1` って何？")).toBe(
			">/dev/null 2>&1 って何？",
		);
	});

	it("バッククォートを含まないタイトルはそのまま返す", () => {
		expect(plainTitle("普通の記事タイトル")).toBe("普通の記事タイトル");
	});
});
