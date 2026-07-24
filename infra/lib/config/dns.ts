export const blogDomainName = "blog.gobo-cello.com" as const;

export const sandboxBlogDomainName = "sandbox.blog.gobo-cello.com" as const;

/** @internal テストの toThrow アサーションのためだけに export しており、production コードからは参照されない */
export class InvalidNameServersError extends Error {
	public constructor(value: unknown) {
		super(`Invalid name servers: ${String(value)}`);
		this.name = "InvalidNameServersError";
	}
}

export function parseNameServers(value: string): readonly string[] {
	const nameServers = value.split(",").map((entry) => entry.trim());

	if (
		nameServers.length === 0 ||
		nameServers.some((entry) => entry.length === 0)
	) {
		throw new InvalidNameServersError(value);
	}

	return nameServers;
}
