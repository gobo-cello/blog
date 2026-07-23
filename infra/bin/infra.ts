#!/usr/bin/env node
import path from "node:path";
import { App, RemovalPolicy } from "aws-cdk-lib/core";
import { sandboxBlogDomainName } from "../lib/config/dns";
import { loadBlogConfiguration } from "../lib/config/environments";
import { DnsStack } from "../lib/stacks/dns-stack";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";
import { HostingStack } from "../lib/stacks/hosting-stack";
import { SandboxDnsStack } from "../lib/stacks/sandbox-dns-stack";

const app = new App();
const configuration = loadBlogConfiguration();

// app/distへの絶対path。appとinfraは別々のnpm projectであり、
// 共有の設定helperを持たないため、実行ファイルからの相対pathで解決する。
const sandboxSiteContentPath = path.join(__dirname, "..", "..", "app", "dist");

new GithubDeployRoleStack(app, "SandboxGithubDeployRoleStack", {
	env: configuration.sandbox,
	awsEnvironment: configuration.sandbox,
	deploymentEnvironment: "sandbox",
	// SandboxDnsStackなど、CloudFront用ACM証明書はus-east-1固定のstackもdeployするため。
	additionalRegions: ["us-east-1"],
});

new GithubDeployRoleStack(app, "ProductionGithubDeployRoleStack", {
	env: configuration.production,
	awsEnvironment: configuration.production,
	deploymentEnvironment: "production",
	// ProductionDnsStackなど、CloudFront用ACM証明書はus-east-1固定のstackもdeployするため。
	additionalRegions: ["us-east-1"],
});

new DnsStack(app, "ProductionDnsStack", {
	// CloudFrontで使用するACM証明書はus-east-1でしか発行できないため、
	// blog-productionの主リージョン(ap-northeast-1)とは別に固定する。
	env: {
		account: configuration.production.account,
		region: "us-east-1",
	},
	sandboxSubdomainNameServers: configuration.sandboxSubdomainNameServers,
});

const sandboxDnsStack = new SandboxDnsStack(app, "SandboxDnsStack", {
	// 同上の理由により、blog-sandboxもus-east-1で証明書を発行する。
	env: {
		account: configuration.sandbox.account,
		region: "us-east-1",
	},
});

new HostingStack(app, "SandboxHostingStack", {
	// HostingStackはDNS Stackと同じus-east-1に置き、cross-region
	// cross-stack参照を避ける。
	env: {
		account: configuration.sandbox.account,
		region: "us-east-1",
	},
	deploymentEnvironment: "sandbox",
	domainName: sandboxBlogDomainName,
	hostedZone: sandboxDnsStack.hostedZone,
	certificate: sandboxDnsStack.certificate,
	siteContentPath: sandboxSiteContentPath,
	removalPolicy: RemovalPolicy.DESTROY,
	autoDeleteObjects: true,
});
