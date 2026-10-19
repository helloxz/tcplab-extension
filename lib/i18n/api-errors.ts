import type { Locale, MessageKey, Translate } from '@/lib/i18n'

/**
 * TCPLab 后端返回的 msg 是 i18n key，前端的通用字典里没有这些 key。
 * 这里保留扩展实际会遇到的 API / WHOIS 错误文案。
 */
const en: Record<string, string> = {
  'api.param.name.invalid': 'Invalid domain name: {name}',
  'api.param.name.ip_unsupported': 'Please enter a domain name, not an IP address.',
  'api.param.name.wildcard_unsupported': 'Wildcard queries are not supported.',
  'api.param.host.invalid': 'Invalid host: {host}',
  'api.param.host.private': 'The target resolves to a private or reserved address, so it cannot be checked.',
  'api.param.port.invalid': 'Invalid port: {port}. Use an integer between 1 and 65535.',
  'api.param.type.unsupported': 'Unsupported record type: {type}',
  'api.param.server.unsupported': 'Unsupported DNS server.',
  'api.notfound.domain': 'No DNS records found for {name}.',
  'api.notfound.address': 'No IP address was found for {name}.',
  'api.notfound.whois': 'No registration data found for {name}.',
  'api.upstream.timeout': 'The DNS query timed out. Please try again.',
  'api.upstream.servfail': 'The DNS server failed to process the request (SERVFAIL).',
  'api.upstream.refused': 'The DNS server refused the query (REFUSED).',
  'api.upstream.error': 'The DNS query failed. Please try again.',
  'api.upstream.tls.timeout': 'The TLS handshake timed out. Please try again.',
  'api.upstream.tls.refused': 'The connection was refused — nothing is listening on this port, or TLS is not enabled.',
  'api.upstream.tls.handshake': 'The TLS handshake failed — the site may not support HTTPS, its TLS configuration may be incompatible, or the network interrupted the connection.',
  'api.upstream.tls.error': 'The TLS handshake failed. Please try again.',
  'api.rate.limited': 'Too many requests. Please retry in {seconds} seconds.',
  'api.rate.limitedDaily': 'Your daily quota has been used up. Please try again tomorrow.',
  'api.server.internal': 'Server error. Please try again later.',
  'whois.error.invalid': 'That does not look like a valid domain name.',
  'whois.error.unsupported': 'This TLD is not supported by the WHOIS service.',
  'whois.error.rateLimited': 'The WHOIS service is rate-limiting requests. Please wait a moment and try again.',
  'whois.error.timeout': 'The registry took too long to respond. Please try again.',
  'whois.error.unavailable': 'The WHOIS service is unavailable right now. Please try again later.',
}

const zh: Record<string, string> = {
  'api.param.name.invalid': '域名格式不正确：{name}',
  'api.param.name.ip_unsupported': '请输入域名，而不是 IP 地址。',
  'api.param.name.wildcard_unsupported': '不支持通配符查询（如 *.example.com）。',
  'api.param.host.invalid': '主机格式不正确：{host}',
  'api.param.host.private': '目标解析到内网或保留地址，无法检测。',
  'api.param.port.invalid': '端口格式不正确：{port}（需为 1-65535 的整数）',
  'api.param.type.unsupported': '不支持的记录类型：{type}',
  'api.param.server.unsupported': '不支持的 DNS 服务器。',
  'api.notfound.domain': '未找到域名 {name} 的解析记录。',
  'api.notfound.address': '未解析到域名 {name} 的 IP 地址。',
  'api.notfound.whois': '未找到域名 {name} 的注册信息。',
  'api.upstream.timeout': 'DNS 查询超时，请重试。',
  'api.upstream.servfail': 'DNS 服务器暂时无法处理该请求（SERVFAIL）。',
  'api.upstream.refused': 'DNS 服务器拒绝了该查询（REFUSED）。',
  'api.upstream.error': 'DNS 查询失败，请重试。',
  'api.upstream.tls.timeout': 'TLS 握手超时，请重试。',
  'api.upstream.tls.refused': '连接被拒绝 —— 目标端口没有服务监听，或未启用 TLS。',
  'api.upstream.tls.handshake': 'TLS 握手失败 —— 站点可能未启用 HTTPS、其 TLS 配置与检测端不兼容，或网络中断。',
  'api.upstream.tls.error': 'TLS 握手失败，请重试。',
  'api.rate.limited': '查询过于频繁，请在 {seconds} 秒后重试。',
  'api.rate.limitedDaily': '今日配额已用完，请明日再试。',
  'api.server.internal': '服务异常，请稍后重试。',
  'whois.error.invalid': '这看起来不是有效的域名。',
  'whois.error.unsupported': 'WHOIS 服务暂不支持该后缀。',
  'whois.error.rateLimited': 'WHOIS 服务请求过于频繁，请稍后重试。',
  'whois.error.timeout': '注册局响应超时，请稍后重试。',
  'whois.error.unavailable': 'WHOIS 服务当前不可用，请稍后重试。',
}

function interpolate(template: string, args?: Record<string, unknown>): string {
  if (!args) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = args[name]
    return value == null ? match : String(value)
  })
}

export function translateApiError(
  key: string,
  args: Record<string, unknown> | undefined,
  locale: Locale,
  t: Translate,
): string {
  const template = (locale === 'zh' ? zh : en)[key]
  if (template) return interpolate(template, args)

  if (key.startsWith('api.') || key.startsWith('whois.')) {
    return t('errors.apiFallback')
  }

  return t(key as MessageKey)
}
