import { Tags } from "aws-cdk-lib";
import type { IConstruct } from "constructs";
import type { BlogEnvironment } from "./environments";

export interface PlatformTags {
	readonly Owner: string;
	readonly ManagedBy: "AWS-CDK";
	readonly Repository: "gobo-cello/blog";
	readonly Workload: "blog";
	readonly Environment: BlogEnvironment;
}

const commonTags = {
	Owner: "gobo-cello",
	ManagedBy: "AWS-CDK",
	Repository: "gobo-cello/blog",
	Workload: "blog",
} as const satisfies Omit<PlatformTags, "Environment">;

export function createPlatformTags(environment: BlogEnvironment): PlatformTags {
	return {
		...commonTags,
		Environment: environment,
	};
}

export function applyPlatformTags(scope: IConstruct, tags: PlatformTags): void {
	for (const [key, value] of Object.entries(tags)) {
		Tags.of(scope).add(key, value);
	}
}
