declare const awsAccountIdBrand: unique symbol;

export type AwsAccountId = string & {
	readonly [awsAccountIdBrand]: "AwsAccountId";
};

/** @internal テストの toThrow アサーションのためだけに export しており、production コードからは参照されない */
export class InvalidAwsAccountIdError extends Error {
	public constructor(value: unknown) {
		super(`Invalid AWS account ID: ${String(value)}`);
		this.name = "InvalidAwsAccountIdError";
	}
}

export function parseAwsAccountId(value: unknown): AwsAccountId {
	if (typeof value !== "string" || !/^\d{12}$/.test(value)) {
		throw new InvalidAwsAccountIdError(value);
	}

	return value as AwsAccountId;
}
