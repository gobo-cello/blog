import { Match, Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { parseAwsAccountId } from "../lib/config/accounts";
import { DnsStack } from "../lib/stacks/dns-stack";

describe("DnsStack", () => {
	const app = new App();
	const stack = new DnsStack(app, "TestDnsStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
	});
	const template = Template.fromStack(stack);

	test("blog.gobo-cello.com用のhosted zoneを作成する", () => {
		template.resourceCountIs("AWS::Route53::HostedZone", 1);
		template.hasResourceProperties("AWS::Route53::HostedZone", {
			Name: "blog.gobo-cello.com.",
		});
	});

	test("hosted zoneでDNS検証するACM証明書を作成する", () => {
		template.hasResourceProperties("AWS::CertificateManager::Certificate", {
			DomainName: "blog.gobo-cello.com",
			ValidationMethod: "DNS",
			DomainValidationOptions: Match.arrayWith([
				Match.objectLike({
					DomainName: "blog.gobo-cello.com",
					HostedZoneId: Match.objectLike({
						Ref: Match.stringLikeRegexp("BlogHostedZone"),
					}),
				}),
			]),
		});
	});

	test("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});

	test("sandboxSubdomainNameServersが未指定の場合はNS delegationレコードを作成しない", () => {
		template.resourceCountIs("AWS::Route53::RecordSet", 0);
	});
});

describe("DnsStack (sandboxSubdomainNameServers指定時)", () => {
	const app = new App();
	const stack = new DnsStack(app, "TestDnsStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		sandboxSubdomainNameServers: ["ns-1.awsdns-00.com", "ns-2.awsdns-00.org"],
	});
	const template = Template.fromStack(stack);

	test("sandbox宛のNS delegationレコードを作成する", () => {
		template.hasResourceProperties("AWS::Route53::RecordSet", {
			Name: "sandbox.blog.gobo-cello.com.",
			Type: "NS",
			ResourceRecords: Match.arrayEquals([
				"ns-1.awsdns-00.com",
				"ns-2.awsdns-00.org",
			]),
		});
	});
});
