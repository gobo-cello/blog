import { Match, Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { parseAwsAccountId } from "../lib/config/accounts";
import { SandboxDnsStack } from "../lib/stacks/sandbox-dns-stack";

describe("SandboxDnsStack", () => {
	const app = new App();
	const stack = new SandboxDnsStack(app, "TestSandboxDnsStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
	});
	const template = Template.fromStack(stack);

	test("sandbox.blog.gobo-cello.com用のhosted zoneを作成する", () => {
		template.resourceCountIs("AWS::Route53::HostedZone", 1);
		template.hasResourceProperties("AWS::Route53::HostedZone", {
			Name: "sandbox.blog.gobo-cello.com.",
		});
	});

	test("hosted zoneでDNS検証するACM証明書を作成する", () => {
		template.hasResourceProperties("AWS::CertificateManager::Certificate", {
			DomainName: "sandbox.blog.gobo-cello.com",
			ValidationMethod: "DNS",
			DomainValidationOptions: Match.arrayWith([
				Match.objectLike({
					DomainName: "sandbox.blog.gobo-cello.com",
					HostedZoneId: Match.objectLike({
						Ref: Match.stringLikeRegexp("SandboxBlogHostedZone"),
					}),
				}),
			]),
		});
	});

	test("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});
});
