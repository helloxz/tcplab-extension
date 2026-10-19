<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { en as enLocale, zh_cn as zhLocale } from '@nuxt/ui/locale'
import DnsPanel from '@/components/DnsPanel.vue'
import TlsPanel from '@/components/TlsPanel.vue'
import WhoisPanel from '@/components/WhoisPanel.vue'
import { useCachedResource, type ResourceStatus } from '@/composables/useCachedResource'
import { computeAudit, type AuditGrade, type AuditResult } from '@/lib/audit'
import { queryIcp } from '@/lib/api/icp'
import type { DnsDomainResult, IcpQueryResult, TlsCheckResult, WhoisResult } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import { useI18n } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { classifyUrl, type SiteTarget, type UnsupportedReason } from '@/lib/site/url'

const { locale, t } = useI18n()

const uiLocale = computed(() => (locale.value === 'zh' ? zhLocale : enLocale))

const params = new URLSearchParams(window.location.search)
const restricted = params.get('error') === 'restricted'
const rawUrl = params.get('url') ?? ''
const rawTitle = params.get('title') ?? ''

type OverlayReason = UnsupportedReason | 'restricted'

type PageState =
  | { status: 'supported'; title: string; site: SiteTarget }
  | { status: 'unsupported'; reason: OverlayReason; title?: string }

const page = computed<PageState>(() => {
  if (restricted || !rawUrl) {
    return { status: 'unsupported', reason: 'restricted', title: rawTitle }
  }

  const site = classifyUrl(rawUrl)
  if (site.kind === 'unsupported') {
    return { status: 'unsupported', reason: site.reason, title: rawTitle }
  }

  return {
    status: 'supported',
    title: rawTitle || site.hostname,
    site,
  }
})

const unsupportedKey: Record<OverlayReason, MessageKey> = {
  blank: 'popup.unsupported.blank',
  internal: 'popup.unsupported.internal',
  local: 'popup.unsupported.local',
  invalid: 'popup.unsupported.invalid',
  restricted: 'overlay.restricted',
}

const unsupportedMessage = computed(() => (
  page.value.status === 'unsupported' ? t(unsupportedKey[page.value.reason]) : ''
))

const siteKey = computed(() => {
  if (page.value.status !== 'supported') return 'unsupported'
  const site = page.value.site
  return `${site.protocol}//${site.hostname}:${site.port ?? ''}`
})

const tlsPort = computed(() => {
  if (page.value.status !== 'supported') return 443
  const site = page.value.site
  return site.protocol === 'https:' ? (site.port ?? 443) : 443
})

const isHttps = computed(() => (
  page.value.status === 'supported' && page.value.site.protocol === 'https:'
))

interface PanelExposed<T> {
  refresh: () => Promise<void>
  data: T | null
  status: ResourceStatus
}

const dnsRef = ref<PanelExposed<DnsDomainResult> | null>(null)
const tlsRef = ref<PanelExposed<TlsCheckResult> | null>(null)
const whoisRef = ref<PanelExposed<WhoisResult> | null>(null)
const refreshingAll = ref(false)

const isSupportedDomain = computed(() => (
  page.value.status === 'supported' && !page.value.site.isIp
))

const dnsData = computed(() => dnsRef.value?.data ?? null)
const tlsData = computed(() => tlsRef.value?.data ?? null)
const whoisData = computed(() => whoisRef.value?.data ?? null)

const dnsStatus = computed<ResourceStatus>(() => dnsRef.value?.status ?? 'idle')
const tlsStatus = computed<ResourceStatus>(() => tlsRef.value?.status ?? 'idle')
const whoisStatus = computed<ResourceStatus>(() => whoisRef.value?.status ?? 'idle')

const auditLoading = computed(() => {
  if (!isSupportedDomain.value) return false
  return [dnsStatus.value, whoisStatus.value, tlsStatus.value]
    .some(status => status === 'idle' || status === 'loading')
})

const audit = computed<AuditResult | null>(() => {
  if (!isSupportedDomain.value || auditLoading.value) return null
  return computeAudit({ dns: dnsData.value, whois: whoisData.value, tls: tlsData.value })
})

const gradeKeys: Record<AuditGrade, MessageKey> = {
  S: 'audit.grade.S',
  A: 'audit.grade.A',
  B: 'audit.grade.B',
  C: 'audit.grade.C',
  D: 'audit.grade.D',
  F: 'audit.grade.F',
}

const auditLine = computed(() => {
  if (auditLoading.value) return '…'
  if (!audit.value) return '—'
  return `${audit.value.grade} · ${audit.value.score}/100`
})

const auditLabel = computed(() => {
  if (auditLoading.value) return t('audit.loading')
  if (!audit.value) return t('audit.unavailable')
  return t(gradeKeys[audit.value.grade])
})

const auditTone = computed(() => {
  if (auditLoading.value || !audit.value) return 'text-muted'
  switch (audit.value.grade) {
    case 'S':
    case 'A':
      return 'text-success'
    case 'B':
      return 'text-info'
    case 'C':
    case 'D':
      return 'text-warning'
    default:
      return 'text-error'
  }
})

const auditTip = computed(() => {
  if (auditLoading.value) return t('audit.loading')
  if (!audit.value) return t('audit.unavailable')
  const parts = [t('audit.basis')]
  if (audit.value.capReason === 'invalid-cert') parts.push(t('audit.cap.invalidCert'))
  if (audit.value.partial) parts.push(t('audit.partial'))
  return parts.join(' · ')
})

const showIcp = computed(() => locale.value === 'zh' && isSupportedDomain.value)

const icp = useCachedResource<IcpQueryResult>({
  cacheKey: () => cacheKey('icp', page.value.status === 'supported' ? page.value.site.hostname : ''),
  ttl: CACHE_TTL_MS.icp,
  enabled: () => showIcp.value,
  fetcher: () => queryIcp(page.value.status === 'supported' ? page.value.site.hostname : ''),
})

watch([siteKey, locale], () => {
  if (isSupportedDomain.value) void icp.load()
}, { immediate: true })

const icpRecord = computed(() => icp.data.value?.records[0] ?? null)

const icpFiled = computed(() => icp.data.value?.filed === true && !!icpRecord.value)

const icpLicenceLine = computed(() => {
  const record = icpRecord.value
  if (!record) return t('overlay.icp.filed')
  const licence = record.serviceLicence || record.mainLicence || t('overlay.icp.filed')
  return record.natureName ? `${licence} · ${record.natureName}` : licence
})

const icpSubject = computed(() => icpRecord.value?.unitName ?? '')

const icpBadge = computed<{ color: 'neutral' | 'success'; text: string }>(() => {
  const data = icp.data.value
  const record = icpRecord.value

  if (data) {
    if (data.filed) {
      const licence = record
        ? (record.serviceLicence || record.mainLicence || t('overlay.icp.filed'))
        : t('overlay.icp.filed')
      return {
        color: 'success',
        text: record?.natureName ? `${licence} · ${record.natureName}` : licence,
      }
    }
    return { color: 'neutral', text: t('overlay.icp.unfiled') }
  }

  if (icp.error.value) return { color: 'neutral', text: t('overlay.icp.unavailable') }
  return { color: 'neutral', text: t('overlay.icp.loading') }
})

const icpTitle = computed(() => {
  const record = icpRecord.value
  if (!record) return ''
  return [record.unitName, record.serviceLicence, record.mainLicence]
    .filter(Boolean)
    .join(' · ')
})

const deepCheckUrl = computed(() => {
  if (!isSupportedDomain.value) return ''
  const hostname = page.value.status === 'supported' ? page.value.site.hostname : ''
  if (!hostname) return ''
  const base = locale.value === 'zh'
    ? 'https://tcp.lc/zh/domain-check'
    : 'https://tcp.lc/domain-check'
  return `${base}?domain=${encodeURIComponent(hostname)}`
})

async function refreshAll() {
  refreshingAll.value = true
  try {
    const tasks: Array<Promise<unknown> | undefined> = [
      dnsRef.value?.refresh(),
      tlsRef.value?.refresh(),
      whoisRef.value?.refresh(),
    ]
    if (showIcp.value) tasks.push(icp.load(true))
    await Promise.allSettled(tasks)
  } finally {
    refreshingAll.value = false
  }
}

async function closeOverlay() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'tcplab:close' }, '*')
    return
  }

  // 独立 popup 窗口（受限页面提示）直接关窗口
  try {
    const current = await browser.windows.getCurrent()
    if (current.id != null) {
      await browser.windows.remove(current.id)
      return
    }
  } catch {
    // fall through
  }
  window.close()
}

function openSettings() {
  void browser.runtime.openOptionsPage()
}
</script>

<template>
  <UApp :locale="uiLocale">
    <div class="min-h-screen">
      <header class="sticky top-0 z-10 border-b border-default bg-default px-3 py-2.5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <img
              src="/icon/128.png"
              alt="TCPLab"
              class="size-9 shrink-0 object-contain"
            >
            <div class="min-w-0">
              <h1 class="truncate text-sm font-semibold text-highlighted">
                {{ t('app.name') }}
              </h1>
              <p class="truncate text-xs text-muted">
                {{ t('app.subtitle') }}
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-0.5">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="refreshingAll"
              :aria-label="t('popup.refresh')"
              @click="refreshAll"
            />
            <UButton
              icon="i-lucide-settings"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="t('popup.settings')"
              @click="openSettings"
            />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="t('overlay.close')"
              @click="closeOverlay"
            />
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-3xl px-3 pb-4">
        <UCard
          v-if="page.status === 'supported'"
          class="mt-3"
          :ui="{ body: 'p-3 sm:p-3' }"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated">
              <UIcon name="i-lucide-globe" class="size-5 text-muted" />
            </div>

            <div class="min-w-0 flex-1">
              <h2 class="truncate text-base font-semibold text-highlighted">
                {{ page.title }}
              </h2>
              <p class="mt-1 truncate font-mono text-xs text-muted">
                {{ page.site.hostname }}
              </p>

              <div v-if="page.site.isIp || showIcp" class="mt-2 flex flex-wrap items-center gap-2">
                <UBadge v-if="page.site.isIp" color="neutral" variant="subtle" size="sm">
                  {{ t('common.ip') }} v{{ page.site.ipVersion }}
                </UBadge>

                <template v-if="showIcp">
                  <div
                    v-if="icpFiled"
                    class="w-full min-w-0 rounded-md border border-success/30 bg-success/5 px-2 py-1"
                    :title="icpTitle"
                  >
                    <p class="truncate text-[11px] font-medium leading-tight text-success">
                      {{ icpLicenceLine }}
                    </p>
                    <p
                      v-if="icpSubject"
                      class="mt-0.5 truncate text-[10px] leading-tight text-muted"
                    >
                      {{ icpSubject }}
                    </p>
                  </div>
                  <UBadge
                    v-else
                    :color="icpBadge.color"
                    variant="subtle"
                    size="sm"
                    :title="icpTitle"
                  >
                    {{ icpBadge.text }}
                  </UBadge>
                </template>
              </div>
            </div>

            <UTooltip
              v-if="isSupportedDomain"
              :text="auditTip"
              :ui="{ content: 'h-auto max-w-64 px-3 py-2', text: 'whitespace-normal leading-relaxed' }"
            >
              <div
                tabindex="0"
                class="flex size-[72px] shrink-0 cursor-help flex-col items-center justify-center rounded-xl border border-default bg-elevated px-1.5 py-1.5"
                :class="auditTone"
              >
                <span class="text-[11px] font-semibold leading-none">{{ auditLine }}</span>
                <span class="mt-1 text-center text-[10px] leading-tight">{{ auditLabel }}</span>
              </div>
            </UTooltip>
          </div>

          <div
            v-if="deepCheckUrl"
            class="mt-3 flex items-center justify-between gap-2 border-t border-default pt-2"
          >
            <span class="text-[11px] text-muted">{{ t('overlay.deepCheckHint') }}</span>
            <a
              :href="deepCheckUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-primary transition hover:underline"
            >
              {{ t('overlay.deepCheck') }}
              <UIcon name="i-lucide-arrow-up-right" class="size-3" />
            </a>
          </div>
        </UCard>

        <UCard v-else class="mt-3" :ui="{ body: 'p-3 sm:p-3' }">
          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-shield-alert"
            :title="t('popup.unsupported.title')"
            :description="unsupportedMessage"
          />
          <p v-if="page.title" class="mt-3 line-clamp-2 text-xs text-muted">
            {{ page.title }}
          </p>
        </UCard>

        <div v-if="page.status === 'supported'" class="mt-3 space-y-3">
          <UCard :ui="{ body: 'p-3 sm:p-3' }">
            <DnsPanel
              :key="`dns-${siteKey}`"
              ref="dnsRef"
              :hostname="page.site.hostname"
              :is-ip="page.site.isIp"
              :locale="locale"
              :t="t"
            />
          </UCard>

          <UCard :ui="{ body: 'p-3 sm:p-3' }">
            <WhoisPanel
              :key="`whois-${siteKey}`"
              ref="whoisRef"
              :hostname="page.site.hostname"
              :is-ip="page.site.isIp"
              :locale="locale"
              :t="t"
            />
          </UCard>

          <UCard :ui="{ body: 'p-3 sm:p-3' }">
            <TlsPanel
              :key="`tls-${siteKey}`"
              ref="tlsRef"
              :hostname="page.site.hostname"
              :port="tlsPort"
              :is-https="isHttps"
              :is-ip="page.site.isIp"
              :locale="locale"
              :t="t"
            />
          </UCard>
        </div>

        <p class="mt-3 text-center text-[11px] text-dimmed">
          <a
            href="https://tcp.lc"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-primary"
          >
            {{ t('popup.dataSource') }}
          </a>
        </p>
      </main>
    </div>
  </UApp>
</template>
