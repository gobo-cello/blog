import {
	InvalidAwsAccountIdError,
	parseAwsAccountId,
} from "../lib/config/accounts";

describe("parseAwsAccountId", () => {
	test("12桁のAWS account IDを受け入れる", () => {
		expect(parseAwsAccountId("123456789012")).toBe("123456789012");
	});

	test.each([undefined, null, "", "123", "12345678901a", 123456789012])(
		"不正な値を拒否する: %p",
		(value: unknown) => {
			expect(() => parseAwsAccountId(value)).toThrow(InvalidAwsAccountIdError);
		},
	);
});
