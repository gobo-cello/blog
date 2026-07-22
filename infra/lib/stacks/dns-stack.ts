import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { blogDomainName } from "../config/dns";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export class DnsStack extends Stack {
	public constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const zone = new HostedZone(this, "BlogHostedZone", {
			zoneName: blogDomainName,
		});

		new Certificate(this, "BlogCertificate", {
			domainName: blogDomainName,
			validation: CertificateValidation.fromDns(zone),
		});

		applyPlatformTags(this, createPlatformTags("production"));

		new CfnOutput(this, "BlogHostedZoneNameServers", {
			value: Fn.join(",", zone.hostedZoneNameServers ?? []),
			description:
				"aws-platform側のBLOG_SUBDOMAIN_NAME_SERVERS環境変数に設定する値",
		});
	}
}
