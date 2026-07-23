import path from "node:path";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import { parseAwsAccountId } from "../lib/config/accounts";
import type { BlogEnvironment } from "../lib/config/environments";
import { HostingStack } from "../lib/stacks/hosting-stack";

const fixtureSiteContentPath = path.join(__dirname, "fixtures", "static-site");

interface EnvironmentShape {
	readonly deploymentEnvironment: BlogEnvironment;
	readonly domainName: string;
	readonly removalPolicy: RemovalPolicy;
	readonly autoDeleteObjects: boolean;
}

const environmentShapes: readonly EnvironmentShape[] = [
	{
		deploymentEnvironment: "sandbox",
		domainName: "sandbox.blog.gobo-cello.com",
		removalPolicy: RemovalPolicy.DESTROY,
		autoDeleteObjects: true,
	},
	{
		deploymentEnvironment: "production",
		domainName: "blog.gobo-cello.com",
		removalPolicy: RemovalPolicy.RETAIN,
		autoDeleteObjects: false,
	},
];

function synthesize(shape: EnvironmentShape) {
	const app = new App();
	const dnsStack = new Stack(
		app,
		`Test${shape.deploymentEnvironment}DnsStack`,
		{
			env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		},
	);
	const hostedZone = new HostedZone(dnsStack, "HostedZone", {
		zoneName: shape.domainName,
	});
	const certificate = new Certificate(dnsStack, "Certificate", {
		domainName: shape.domainName,
		validation: CertificateValidation.fromDns(hostedZone),
	});

	const stack = new HostingStack(
		app,
		`Test${shape.deploymentEnvironment}HostingStack`,
		{
			env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
			deploymentEnvironment: shape.deploymentEnvironment,
			domainName: shape.domainName,
			hostedZone,
			certificate,
			siteContentPath: fixtureSiteContentPath,
			removalPolicy: shape.removalPolicy,
			autoDeleteObjects: shape.autoDeleteObjects,
		},
	);

	return { stack, template: Template.fromStack(stack) };
}

describe.each(environmentShapes)(
	"HostingStack($deploymentEnvironment)",
	(shape) => {
		const { stack, template } = synthesize(shape);

		test("CloudFront Distributionを1つ作成する", () => {
			template.resourceCountIs("AWS::CloudFront::Distribution", 1);
			template.hasResourceProperties("AWS::CloudFront::Distribution", {
				DistributionConfig: Match.objectLike({
					Aliases: [shape.domainName],
				}),
			});
		});

		test(`removalPolicy(${shape.removalPolicy})をS3 bucketへ適用する`, () => {
			const expectedDeletionPolicy =
				shape.removalPolicy === RemovalPolicy.RETAIN ? "Retain" : "Delete";
			template.hasResource("AWS::S3::Bucket", {
				DeletionPolicy: expectedDeletionPolicy,
			});
		});

		test("Stack termination protectionを有効にする", () => {
			expect(stack.terminationProtection).toBe(true);
		});

		test("DistributionDomainNameをCfnOutputとして出力する", () => {
			template.hasOutput("DistributionDomainName", {});
		});
	},
);
