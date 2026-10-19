<script setup lang="ts">
import { computed, ref } from 'vue'
import { en as enLocale, zh_cn as zhLocale } from '@nuxt/ui/locale'
import DnsPanel from '@/components/DnsPanel.vue'
import TlsPanel from '@/components/TlsPanel.vue'
import WhoisPanel from '@/components/WhoisPanel.vue'
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

const dnsRef = ref<{ refresh: () => Promise<void> } | null>(null)
const tlsRef = ref<{ refresh: () => Promise<void> } | null>(null)
const whoisRef = ref<{ refresh: () => Promise<void> } | null>(null)
const refreshingAll = ref(false)

async function refreshAll() {
  refreshingAll.value = true
  try {
    await Promise.allSettled([
      dnsRef.value?.refresh(),
      tlsRef.value?.refresh(),
      whoisRef.value?.refresh(),
    ])
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
              <p class="text-xs font-medium text-dimmed">
                {{ t('popup.currentPage') }}
              </p>
              <h2 class="mt-0.5 line-clamp-2 text-base font-semibold text-highlighted">
                {{ page.title }}
              </h2>
              <p class="mt-1 truncate font-mono text-xs text-muted">
                {{ page.site.hostname }}
              </p>

              <div class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  :color="page.site.protocol === 'https:' ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                >
                  {{ page.site.protocol === 'https:' ? t('common.https') : t('common.http') }}
                </UBadge>
                <UBadge v-if="page.site.isIp" color="neutral" variant="subtle" size="sm">
                  {{ t('common.ip') }} v{{ page.site.ipVersion }}
                </UBadge>
              </div>
            </div>
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
