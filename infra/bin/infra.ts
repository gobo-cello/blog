#!/usr/bin/env node
import { App } from "aws-cdk-lib/core";
import { loadBlogConfiguration } from "../lib/config/environments";
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
