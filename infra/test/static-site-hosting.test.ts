import path from "node:path";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { App, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import { describe, test } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { StaticSiteHosting } from "../lib/constructs/static-site-hosting";

const fixtureSiteContentPath = path.join(__dirname, "fixtures", "static-site");

describe("StaticSiteHosting", () => {
	const app = new App();
	const stack = new Stack(app, "TestStaticSiteHostingStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
	});
	const hostedZone = new HostedZone(stack, "TestHostedZone", {
		zoneName: "example.com",
	});
	const certificate = new Certificate(stack, "TestCertificate", {
		domainName: "example.com",
		validation: CertificateValidation.fromDns(hostedZone),
	});

	new StaticSiteHosting(stack, "StaticSiteHosting", {
		domainName: "example.com",
		hostedZone,
		certificate,
		siteContentPath: fixtureSiteContentPath,
		removalPolicy: RemovalPolicy.DESTROY,
		autoDeleteObjects: true,
		noIndex: false,
	});

	const template = Template.fromStack(stack);

	test("privateなS3 bucketをサイト配信用に作成する", () => {
		template.hasResourceProperties("AWS::S3::Bucket", {
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: true,
				BlockPublicPolicy: true,
				IgnorePublicAcls: true,
				RestrictPublicBuckets: true,
			},
		});
	});

	test("CloudFront DistributionをOAC経由のS3 originで作成する", () => {
		template.resourceCountIs("AWS::CloudFront::Distribution", 1);
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				Aliases: ["example.com"],
				DefaultRootObject: "index.html",
				CustomErrorResponses: Match.arrayWith([
					Match.objectLike({
						ErrorCode: 404,
						ResponseCode: 404,
						ResponsePagePath: "/404.html",
					}),
					Match.objectLike({
						ErrorCode: 403,
						ResponseCode: 404,
						ResponsePagePath: "/404.html",
					}),
				]),
			}),
		});
		template.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);
	});

	test("サブディレクトリ配下のindex.htmlへ補完するCloudFront Functionをviewer requestに関連付ける", () => {
		template.resourceCountIs("AWS::CloudFront::Function", 1);
		template.hasResourceProperties("AWS::CloudFront::Function", {
			FunctionConfig: Match.objectLike({
				Runtime: "cloudfront-js-1.0",
			}),
		});
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				DefaultCacheBehavior: Match.objectLike({
					FunctionAssociations: Match.arrayWith([
						Match.objectLike({ EventType: "viewer-request" }),
					]),
				}),
			}),
		});
	});

	test("CloudFrontの標準アクセスログを別バケットへ出力する", () => {
		template.hasResourceProperties("AWS::CloudFront::Distribution", {
			DistributionConfig: Match.objectLike({
				Logging: Match.objectLike({
					Prefix: "cloudfront-access-logs/",
				}),
			}),
		});
	});

	test("アクセスログ用bucketはCloudFront標準ログのACL書き込みを許可する", () => {
		template.hasResourceProperties("AWS::S3::Bucket", {
			AccessControl: "LogDeliveryWrite",
			OwnershipControls: {
				Rules: [{ ObjectOwnership: "ObjectWriter" }],
			},
		});
	});

	test("hosted zoneへCloudFront宛のaliasレコードを作成する", () => {
		template.hasResourceProperties("AWS::Route53::RecordSet", {
			Name: "example.com.",
			Type: "A",
			AliasTarget: Match.objectLike({}),
		});
	});

	test("BucketDeploymentでサイトコンテンツを同期する", () => {
		template.resourceCountIs("Custom::CDKBucketDeployment", 1);
	});

	test("CloudFront invalidationはハッシュ付きアセット(_astro/)を除いたパスに絞る", () => {
		template.hasResourceProperties("Custom::CDKBucketDeployment", {
			DistributionPaths: Match.arrayWith(["/index.html", "/posts/*"]),
		});
		template.hasResourceProperties("Custom::CDKBucketDeployment", {
			DistributionPaths: Match.not(Match.arrayWith(["/_astro/*"])),
		});
	});

	test("noIndex: falseの場合、X-Robots-Tagヘッダーを付与しない", () => {
		template.resourceCountIs("AWS::CloudFront::ResponseHeadersPolicy", 0);
	});
});

describe("StaticSiteHosting(noIndex: true)", () => {
	const app = new App();
	const stack = new Stack(app, "TestNoIndexStaticSiteHostingStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
	});
	const hostedZone = new HostedZone(stack, "TestHostedZone", {
		zoneName: "example.com",
	});
	const certificate = new Certificate(stack, "TestCertificate", {
		domainName: "example.com",
		validation: CertificateValidation.fromDns(hostedZone),
	});

	new StaticSiteHosting(stack, "StaticSiteHosting", {
		domainName: "example.com",
		hostedZone,
		certificate,
		siteContentPath: fixtureSiteContentPath,
		removalPolicy: RemovalPolicy.DESTROY,
		autoDeleteObjects: true,
		noIndex: true,
	});

	const template = Template.fromStack(stack);

	test("X-Robots-Tag: noindexヘッダーを付与する", () => {
		template.hasResourceProperties("AWS::CloudFront::ResponseHeadersPolicy", {
			ResponseHeadersPolicyConfig: Match.objectLike({
				CustomHeadersConfig: {
					Items: [{ Header: "X-Robots-Tag", Override: true, Value: "noindex" }],
				},
			}),
		});
	});
});
