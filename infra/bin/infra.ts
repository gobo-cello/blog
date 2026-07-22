#!/usr/bin/env node
import { App } from "aws-cdk-lib/core";
import { loadBlogConfiguration } from "../lib/config/environments";
import { DnsStack } from "../lib/stacks/dns-stack";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";

const app = new App();
const configuration = loadBlogConfiguration();

new GithubDeployRoleStack(app, "SandboxGithubDeployRoleStack", {
	env: configuration.sandbox,
	awsEnvironment: configuration.sandbox,
	deploymentEnvironment: "sandbox",
});

new GithubDeployRoleStack(app, "ProductionGithubDeployRoleStack", {
	env: configuration.production,
	awsEnvironment: configuration.production,
	deploymentEnvironment: "production",
});

new DnsStack(app, "ProductionDnsStack", {
	// CloudFrontで使用するACM証明書はus-east-1でしか発行できないため、
	// blog-productionの主リージョン(ap-northeast-1)とは別に固定する。
	env: {
		account: configuration.production.account,
		region: "us-east-1",
	},
});
