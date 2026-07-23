import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone, NsRecord } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { blogDomainName } from "../config/dns";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface DnsStackProps extends StackProps {
	readonly sandboxSubdomainNameServers?: readonly string[] | undefined;
}

export class DnsStack extends Stack {
	public constructor(scope: Construct, id: string, props: DnsStackProps) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const zone = new HostedZone(this, "BlogHostedZone", {
			zoneName: blogDomainName,
			comment:
				"blog.gobo-cello.comのhosted zone。sandbox subdomainはblog-sandbox accountのhosted zoneへNS delegationする。",
		});

		new Certificate(this, "BlogCertificate", {
			domainName: blogDomainName,
			validation: CertificateValidation.fromDns(zone),
		});

		if (props.sandboxSubdomainNameServers !== undefined) {
			new NsRecord(this, "SandboxSubdomainDelegation", {
				zone,
				recordName: "sandbox",
				values: [...props.sandboxSubdomainNameServers],
			});
		}

		applyPlatformTags(this, createPlatformTags("production"));

		new CfnOutput(this, "BlogHostedZoneNameServers", {
			value: Fn.join(",", zone.hostedZoneNameServers ?? []),
			description:
				"aws-platform側のBLOG_SUBDOMAIN_NAME_SERVERS環境変数に設定する値",
		});
	}
}
