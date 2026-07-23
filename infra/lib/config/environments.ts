import { type AwsAccountId, parseAwsAccountId } from "./accounts";
import { parseNameServers } from "./dns";

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
	readonly sandboxSubdomainNameServers?: readonly string[] | undefined;
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

function readOptionalEnvironmentVariable(name: string): string | undefined {
	const value: string | undefined = process.env[name];

	return value === undefined || value.length === 0 ? undefined : value;
}

export function loadBlogConfiguration(): BlogConfiguration {
	const region: AwsRegion = "ap-northeast-1";

	const sandboxSubdomainNameServersValue = readOptionalEnvironmentVariable(
		"SANDBOX_SUBDOMAIN_NAME_SERVERS",
	);
	const sandboxSubdomainNameServers =
		sandboxSubdomainNameServersValue === undefined
			? undefined
			: parseNameServers(sandboxSubdomainNameServersValue);

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
		sandboxSubdomainNameServers,
	} satisfies BlogConfiguration;
}
