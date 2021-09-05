import * as Netlify from "./netlify.ts";

export const getDnsZoneForDomain = async (
  domain: Netlify.Domain,
): Promise<Netlify.ReadDnsZone | undefined> => {
  const user = await Netlify.fetchCurrentUser();
  const dnsZones = await Netlify.fetchDnsZones(user.slug);
  return dnsZones.find(({ name }: Netlify.DnsZone) => name == domain);
};

export const ensureUniqueDnsRecords = async (
  domain: Netlify.Domain,
  uniqueHostname: Netlify.Hostname,
  ipv4Values: string | string[],
  ipv6Values?: string | string[],
  ttl = 120,
): Promise<void> => {
  if (typeof ipv6Values === "undefined") ipv6Values = [];
  else if (typeof ipv6Values === "string") ipv6Values = [ipv6Values];
  if (typeof ipv4Values === "string") ipv4Values = [ipv4Values];

  // TODO: handle and respect rate limits?
  const dnsZone = await getDnsZoneForDomain(domain);
  if (!dnsZone) {
    console.error(`Failed to find Netlify DNS Zone for domain ${domain}`);
    return;
  }

  const shouldHandleIpv6 = dnsZone.ipv6_enabled === true &&
    ipv6Values.length > 0;

  const recordParams = {
    hostname: uniqueHostname,
    ttl,
  };

  const dnsRecords = await Netlify.fetchDnsRecords(dnsZone.id);

  const ipv4Records = dnsRecords.filter(({ type }) => type == "A");
  const ipv6Records = dnsRecords.filter(({ type }) => type == "AAAA");

  let shouldUpdate = ipv4Records.length !== ipv4Values.length;
  const ipv4RecordValues = ipv4Records.map(({ value }) => value);
  shouldUpdate = ipv4Values.reduce(
    (shouldUpdate, value) => shouldUpdate || ipv4RecordValues.includes(value),
    shouldUpdate,
  );

  if (shouldHandleIpv6) {
    shouldUpdate = shouldUpdate ||
      (ipv6Values !== undefined && ipv6Records.length !== ipv6Values.length);
    const ipv6RecordValues = ipv6Records.map(({ value }) => value);
    shouldUpdate = ipv6Values !== undefined &&
      ipv6Values.reduce(
        (shouldUpdate, value) =>
          shouldUpdate || ipv6RecordValues.includes(value),
        shouldUpdate,
      );
  }

  if (shouldUpdate) {
    const creates = ipv4Values.map((ipv4Value) =>
      Netlify.createDnsRecord(dnsZone.id, {
        value: ipv4Value,
        type: "A",
        ...recordParams,
      })
    );

    if (shouldHandleIpv6 && ipv6Values !== undefined) {
      ipv6Values.forEach((ipv6Value) =>
        creates.push(
          Netlify.createDnsRecord(dnsZone.id, {
            value: ipv6Value,
            type: "AAAA",
            ...recordParams,
          }),
        )
      );
    }

    const createdRecords = await Promise.all(creates);
    console.debug("Created Records: ", createdRecords, createdRecords.length);

    const dnsRecordsToDelete = ipv4Records.concat(
      shouldHandleIpv6 ? ipv6Records : [],
    ).filter(({ hostname }) => hostname == `${uniqueHostname}.${domain}`);
    const deletions: Response[] = await Promise.all(
      dnsRecordsToDelete.map(async ({ id }: Netlify.ReadDnsRecord) =>
        await Netlify.deleteDnsRecord(dnsZone.id, id)
      ),
    );

    console.debug(["Deletions: ", deletions, deletions.length]);
  } else {
    console.debug("No need to update!");
  }
};
