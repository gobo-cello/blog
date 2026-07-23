import { InvalidNameServersError, parseNameServers } from "../lib/config/dns";

describe("parseNameServers", () => {
	test("カンマ区切りのname serverを配列にする", () => {
		expect(parseNameServers("ns-1.awsdns-00.com,ns-2.awsdns-00.org")).toEqual([
			"ns-1.awsdns-00.com",
			"ns-2.awsdns-00.org",
		]);
	});

	test("前後の空白をtrimする", () => {
		expect(
			parseNameServers(" ns-1.awsdns-00.com , ns-2.awsdns-00.org "),
		).toEqual(["ns-1.awsdns-00.com", "ns-2.awsdns-00.org"]);
	});

	test.each(["", "ns-1.awsdns-00.com,", ",ns-1.awsdns-00.com"])(
		"空要素を含む値を拒否する: %p",
		(value: string) => {
			expect(() => parseNameServers(value)).toThrow(InvalidNameServersError);
		},
	);
});
