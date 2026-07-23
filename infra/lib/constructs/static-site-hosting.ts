import { Duration, type RemovalPolicy } from "aws-cdk-lib";
import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
	Distribution,
	type ErrorResponse,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
	BlockPublicAccess,
	Bucket,
	BucketEncryption,
	type IBucket,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

/**
 * aws-cdk-libの`Bucket`は`isWebsite`等のoptional getterが`boolean | undefined`を
 * 返す一方、`IBucket`はそれを`boolean`(未設定時のみ省略可)として宣言しており、
 * `exactOptionalPropertyTypes: true`下では構造的代入がコンパイルエラーになる
 * (aws-cdk-lib側の既知の制約)。この関数はそのinterop境界でのみ型を合わせる。
 */
function asIBucket(bucket: Bucket): IBucket {
	return bucket as unknown as IBucket;
}

export interface StaticSiteHostingProps {
	readonly domainName: string;
	readonly hostedZone: IHostedZone;
	readonly certificate: ICertificate;
	readonly siteContentPath: string;
	readonly removalPolicy: RemovalPolicy;
	readonly autoDeleteObjects: boolean;
}

export class StaticSiteHosting extends Construct {
	public readonly distribution: Distribution;

	public constructor(
		scope: Construct,
		id: string,
		props: StaticSiteHostingProps,
	) {
		super(scope, id);

		const siteBucket = new Bucket(this, "SiteBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
		});

		const accessLogBucket = new Bucket(this, "AccessLogBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
			lifecycleRules: [{ expiration: Duration.days(90) }],
		});

		this.distribution = new Distribution(this, "Distribution", {
			defaultBehavior: {
				origin: S3BucketOrigin.withOriginAccessControl(asIBucket(siteBucket)),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
			},
			domainNames: [props.domainName],
			certificate: props.certificate,
			defaultRootObject: "index.html",
			errorResponses: [
				{
					httpStatus: 404,
					responseHttpStatus: 404,
					responsePagePath: "/404.html",
				} satisfies ErrorResponse,
			],
			logBucket: asIBucket(accessLogBucket),
			logFilePrefix: "cloudfront-access-logs/",
		});

		new BucketDeployment(this, "SiteDeployment", {
			sources: [Source.asset(props.siteContentPath)],
			destinationBucket: asIBucket(siteBucket),
			distribution: this.distribution,
			distributionPaths: ["/*"],
		});

		new ARecord(this, "SiteAliasRecord", {
			zone: props.hostedZone,
			target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
		});
	}
}
