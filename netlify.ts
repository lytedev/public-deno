export type Token = string;
export type Domain = string;
export type Hostname = string;
export type AccountSlug = string;
export type ZoneId = string;

export interface Identifiable {
  id: string;
}

export interface User {
  email: string;
  slug: string;
}

export interface DnsZone {
  name: Domain;
  supported_record_types: string[];
  dns_servers: string[];
  site_id: string;
  account_slug: AccountSlug;
  ipv6_enabled?: boolean;
}

export interface DnsRecord {
  type: string;
  hostname: Hostname;
  value: string;
  ttl: number;
  priority?: number;
  weight?: number;
  port?: number;
  flag?: number;
  tag?: string;
}

export type ReadDnsZone = DnsZone & Identifiable;
export type ReadDnsRecord = DnsRecord & Identifiable;

// TODO: surface rate limits

let token: Token = Deno.env.get("NETLIFY_ACCESS_TOKEN") || "";

const NETLIFY_API_PROTOCOL = "https";
const NETLIFY_API_HOST = "api.netlify.com";
const NETLIFY_API_BASE_PATH = "/api/v1";
const NETLIFY_API_BASE_URL =
  `${NETLIFY_API_PROTOCOL}://${NETLIFY_API_HOST}${NETLIFY_API_BASE_PATH}`;

export const netlifyRequest = (apiPath: string, queryParams?: {}): URL => {
  const urlQueryParams = new URLSearchParams(queryParams);
  urlQueryParams.append("access_token", token);
  const url = new URL(`${NETLIFY_API_BASE_URL}/${apiPath}`);
  url.search = urlQueryParams.toString();
  return url;
};

export const netlifyJsonRequest = async <T>(
  apiPath: string,
  queryParams?: Record<string, string>,
  fetchParams = {},
): Promise<T> =>
  await (await fetch(netlifyRequest(apiPath, queryParams), fetchParams))
    .json() as T;

export const fetchCurrentUser = async (): Promise<User> =>
  await netlifyJsonRequest("user");

export const fetchDnsZones = async (
  account_slug: AccountSlug,
): Promise<ReadDnsZone[]> =>
  await netlifyJsonRequest("dns_zones", { account_slug });

export const fetchDnsZone = async (zone_id: ZoneId): Promise<ReadDnsZone> =>
  await netlifyJsonRequest("dns_zones", { zone_id });

export const fetchDnsRecords = async (
  zone_id: ZoneId,
): Promise<ReadDnsRecord[]> =>
  await netlifyJsonRequest(`dns_zones/${zone_id}/dns_records`);

export const createDnsRecord = async (
  zone_id: ZoneId,
  params: DnsRecord,
): Promise<ReadDnsRecord> =>
  await netlifyJsonRequest(`dns_zones/${zone_id}/dns_records`, {}, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

export const deleteDnsRecord = async (
  zone_id: ZoneId,
  dns_record_id: string,
): Promise<Response> =>
  await fetch(
    netlifyRequest(`dns_zones/${zone_id}/dns_records/${dns_record_id}`),
    {
      method: "DELETE",
      headers: { "content-type": "application/json" },
    },
  );
