class InvalidBlogDomainNameError extends Error {
	public constructor(value: unknown) {
		super(`Invalid blog domain name: ${String(value)}`);
		this.name = "InvalidBlogDomainNameError";
	}
}

export function parseBlogDomainName(value: unknown): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new InvalidBlogDomainNameError(value);
	}

	return value;
}

export function sandboxDomainNameOf(blogDomainName: string): string {
	return `sandbox.${blogDomainName}`;
}

class InvalidNameServersError extends Error {
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
