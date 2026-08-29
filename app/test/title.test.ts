import { describe, expect, it } from "vitest";
import { parseTitleSegments, plainTitle } from "../src/lib/title";

describe("parseTitleSegments", () => {
	it("バッククォートを含まないタイトルは単一のテキスト区間になる", () => {
		expect(parseTitleSegments("普通の記事タイトル")).toEqual([
			{ code: false, text: "普通の記事タイトル" },
		]);
	});

	it("バッククォートで囲まれた部分を code 区間として切り出す", () => {
		expect(parseTitleSegments("`>/dev/null 2>&1` って何？")).toEqual([
			{ code: false, text: "" },
			{ code: true, text: ">/dev/null 2>&1" },
			{ code: false, text: " って何？" },
		]);
	});

	it("複数のコード区間をそれぞれ独立した区間として切り出す", () => {
		expect(parseTitleSegments("`foo` と `bar` の違い")).toEqual([
			{ code: false, text: "" },
			{ code: true, text: "foo" },
			{ code: false, text: " と " },
			{ code: true, text: "bar" },
			{ code: false, text: " の違い" },
		]);
	});

	it("隣接するコード区間の間には空のテキスト区間が入る", () => {
		expect(parseTitleSegments("`foo``bar`")).toEqual([
			{ code: false, text: "" },
			{ code: true, text: "foo" },
			{ code: false, text: "" },
			{ code: true, text: "bar" },
			{ code: false, text: "" },
		]);
	});

	it("先頭と末尾のコード区間の外側は空のテキスト区間になる", () => {
		expect(parseTitleSegments("`code`")).toEqual([
			{ code: false, text: "" },
			{ code: true, text: "code" },
			{ code: false, text: "" },
		]);
	});

	it("空文字列は空のテキスト区間ひとつになる", () => {
		expect(parseTitleSegments("")).toEqual([{ code: false, text: "" }]);
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
