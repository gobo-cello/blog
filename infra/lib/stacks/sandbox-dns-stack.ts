import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { sandboxBlogDomainName } from "../config/dns";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export class SandboxDnsStack extends Stack {
	public constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const zone = new HostedZone(this, "SandboxBlogHostedZone", {
			zoneName: sandboxBlogDomainName,
		});

		new Certificate(this, "SandboxBlogCertificate", {
			domainName: sandboxBlogDomainName,
			validation: CertificateValidation.fromDns(zone),
		});

		applyPlatformTags(this, createPlatformTags("sandbox"));

		new CfnOutput(this, "SandboxBlogHostedZoneNameServers", {
			value: Fn.join(",", zone.hostedZoneNameServers ?? []),
			description:
				"blog-production accountのSANDBOX_SUBDOMAIN_NAME_SERVERS環境変数に設定する値",
		});
	}
}
