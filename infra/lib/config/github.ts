import type { BlogEnvironment } from "./environments";

export const githubRepository = "gobo-cello/blog" as const;

export const githubActionsOidcProviderUrl =
	"https://token.actions.githubusercontent.com" as const;

export const githubActionsOidcAudience = "sts.amazonaws.com" as const;

export function createGithubActionsSubClaim(
	environment: BlogEnvironment,
): string {
	return `repo:${githubRepository}:environment:${environment}`;
}
