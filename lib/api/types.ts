// TCPLab API 共享类型。
// 来源：后端 shared/types 与 whois 前端归一化类型；扩展内不依赖后端源码。

export type ApiCode = 200 | -1000

export interface ApiResponse<T = unknown> {
  code: ApiCode
  /** 成功为 "ok"；失败为 i18n key（api.*） */
  msg: string
  data: T | null
}

export interface ApiFailureData {
  args?: Record<string, unknown>
}

export type DnsType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'CAA' | 'DNSKEY'

export interface DnsRecord {
  name: string
  type: DnsType
  ttl: number
  value: string
  priority?: number
  segments?: string[]
}

export interface DnsServerSummary {
  key: string
  label: string
  ip: string
}

export interface DnsDomainResult {
  name: string
  server: DnsServerSummary
  elapsed: number
  a: DnsRecord[]
  aaaa: DnsRecord[]
}

export interface DnsQueryResult {
  name: string
  type: DnsType
  server: DnsServerSummary
  elapsed: number
  rcode: number
  records: DnsRecord[]
}

export type TlsValidationIssue =
  | 'expired'
  | 'notYetValid'
  | 'hostname'
  | 'selfSigned'
  | 'untrusted'
  | 'unknown'

export interface TlsCertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  daysRemaining: number
  san: string[]
  publicKeyAlgorithm: string
  publicKeyBits: number | null
  publicKeyCurve: string | null
}

export interface TlsConnectionInfo {
  version: string
  cipher: string
  forwardSecrecy: boolean
  alpn: string | null
  http2: boolean
}

export interface TlsCheckResult {
  host: string
  targetType: 'domain' | 'ip'
  port: number
  ip: string
  addresses: string[]
  elapsed: number
  connection: TlsConnectionInfo
  certificate: TlsCertificateInfo
  validation: {
    valid: boolean
    issues: TlsValidationIssue[]
    errorCode: string | null
  }
}

/** IP 归属数据来源：国内 v4（对外品牌名 TCPLab）/ 国内 v6 / 全球兜底 */
export type IpLookupSource = 'TCPLab' | 'geocn' | 'geolite2'

/** 单个 IP 的归属查询结果（字段已由后端归一化，空值均为空串 / null） */
export interface IpLookupResult {
  target: string
  ip: string
  version: 4 | 6
  /** 域名解析出的地址列表；直接查询 IP 时为空数组 */
  addresses: string[]
  /** 命中数据源；无任何数据时为 null */
  source: IpLookupSource | null
  isDomestic: boolean
  /** ISO 3166-1 alpha-2 国家代码，如 CN / US；未知为空串 */
  country: string
  /** 按查询语言本地化的国家名 */
  countryName: string
  province: string
  city: string
  district: string
  /** 运营商，仅国内库提供；海外为空串 */
  isp: string
  /** 网络类型（宽带 / 基站等），仅国内 IPv6 库提供 */
  type: string
  /** 行政区划代码，仅国内库提供 */
  adcode: string
  longitude: number | null
  latitude: number | null
  /** 时区，仅全球库提供 */
  timezone: string
}

export interface WhoisRegistrar {
  name: string | null
  ianaId: string | null
  url: string | null
  whoisServer: string | null
  abuseEmail: string | null
  abusePhone: string | null
  reseller: string | null
}

export interface WhoisNameserver {
  name: string
  ipv4: string[]
  ipv6: string[]
}

export interface WhoisDsRecord {
  keyTag: string
  algorithm: string
  digestType: string
  digest: string
}

export interface WhoisResult {
  query: string
  domain: string
  domainUnicode: string | null
  id: string | null
  tld: string
  isRegistered: boolean
  registrar: WhoisRegistrar
  status: string[]
  nameservers: WhoisNameserver[]
  dnssec: {
    signed: boolean
    dsData: WhoisDsRecord[]
  }
  dates: {
    created: string | null
    updated: string | null
    expires: string | null
  }
  meta: {
    source: string
    server: string | null
    fetchedAt: string | null
    cached?: boolean
  }
}

/** 一条 ICP 备案记录（后端已把两个上游字段归一） */
export interface IcpRecord {
  domain: string
  /** 主体备案号 */
  mainLicence: string
  /** 网站备案号 */
  serviceLicence: string
  unitName: string
  /** 单位性质，如 企业 / 个人 */
  natureName: string
  contentType: string
  limitAccess: string
  siteName: string | null
  updatedAt: string
}

export type IcpSource = 'primary' | 'fallback'

export interface IcpQueryResult {
  domain: string
  suffix: string
  filed: boolean
  records: IcpRecord[]
  source: IcpSource
  fetchedAt: string
  cached: boolean
}
