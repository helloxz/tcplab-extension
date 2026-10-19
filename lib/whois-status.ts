import type { MessageKey } from '@/lib/i18n'

/**
 * WHOIS / RDAP 常见域名状态代码 → 文案 key。
 * 与 tcp.lc 网站 WHOIS 页面保持一致；未收录的状态保留原始代码且不展示 tooltip。
 */
export const WHOIS_STATUS_KEYS: Partial<Record<string, MessageKey>> = {
  clientTransferProhibited: 'whois.status.clientTransferProhibited',
  serverTransferProhibited: 'whois.status.serverTransferProhibited',
  clientDeleteProhibited: 'whois.status.clientDeleteProhibited',
  serverDeleteProhibited: 'whois.status.serverDeleteProhibited',
  clientUpdateProhibited: 'whois.status.clientUpdateProhibited',
  serverUpdateProhibited: 'whois.status.serverUpdateProhibited',
  clientRenewProhibited: 'whois.status.clientRenewProhibited',
  serverRenewProhibited: 'whois.status.serverRenewProhibited',
  clientHold: 'whois.status.clientHold',
  serverHold: 'whois.status.serverHold',
  pendingDelete: 'whois.status.pendingDelete',
  pendingTransfer: 'whois.status.pendingTransfer',
  pendingRenew: 'whois.status.pendingRenew',
  pendingUpdate: 'whois.status.pendingUpdate',
  inactive: 'whois.status.inactive',
  ok: 'whois.status.ok',
  active: 'whois.status.active',
  redemptionPeriod: 'whois.status.redemptionPeriod',
  autoRenewPeriod: 'whois.status.autoRenewPeriod',
  addPeriod: 'whois.status.addPeriod',
  renewPeriod: 'whois.status.renewPeriod',
  transferPeriod: 'whois.status.transferPeriod',
}
