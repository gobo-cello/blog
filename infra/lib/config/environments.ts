import { type AwsAccountId, parseAwsAccountId } from "./accounts";

export const supportedAwsRegions = ["ap-northeast-1"] as const;

export type AwsRegion = (typeof supportedAwsRegions)[number];

export interface AwsEnvironment {
	readonly account: AwsAccountId;
	readonly region: AwsRegion;
}

export const blogEnvironments = ["sandbox", "production"] as const;

export type BlogEnvironment = (typeof blogEnvironments)[number];

export interface BlogConfiguration {
	readonly sandbox: AwsEnvironment;
	readonly production: AwsEnvironment;
}

export class MissingEnvironmentVariableError extends Error {
	public constructor(name: string) {
		super(`Required environment variable is missing: ${name}`);
		this.name = "MissingEnvironmentVariableError";
	}
}

function readRequiredEnvironmentVariable(name: string): string {
	const value: string | undefined = process.env[name];

	if (value === undefined || value.length === 0) {
		throw new MissingEnvironmentVariableError(name);
	}

	return value;
}

export function loadBlogConfiguration(): BlogConfiguration {
	const region: AwsRegion = "ap-northeast-1";

	return {
		sandbox: {
			account: parseAwsAccountId(
				readRequiredEnvironmentVariable("AWS_BLOG_SANDBOX_ACCOUNT_ID"),
			),
			region,
		},
		production: {
			account: parseAwsAccountId(
				readRequiredEnvironmentVariable("AWS_BLOG_PRODUCTION_ACCOUNT_ID"),
			),
			region,
		},
	} satisfies BlogConfiguration;
}
