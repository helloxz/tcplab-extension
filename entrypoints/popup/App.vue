<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { en as enLocale, zh_cn as zhLocale } from '@nuxt/ui/locale'
import { useI18n } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { classifyUrl, type SiteTarget, type UnsupportedReason } from '@/lib/site/url'

const { locale, t } = useI18n()

const uiLocale = computed(() => (locale.value === 'zh' ? zhLocale : enLocale))

type PageState =
  | { status: 'loading' }
  | { status: 'supported'; title: string; site: SiteTarget }
  | { status: 'unsupported'; reason: UnsupportedReason; title?: string }

const page = ref<PageState>({ status: 'loading' })

const unsupportedKey: Record<UnsupportedReason, MessageKey> = {
  blank: 'popup.unsupported.blank',
  internal: 'popup.unsupported.internal',
  local: 'popup.unsupported.local',
  invalid: 'popup.unsupported.invalid',
}

const unsupportedMessage = computed(() => {
  if (page.value.status !== 'unsupported') return ''
  return t(unsupportedKey[page.value.reason])
})

function openSettings() {
  void browser.runtime.openOptionsPage()
}

onMounted(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

  if (!tab) {
    page.value = { status: 'unsupported', reason: 'invalid' }
    return
  }

  if (!tab.url) {
    page.value = { status: 'unsupported', reason: 'internal', title: tab.title }
    return
  }

  const site = classifyUrl(tab.url)
  if (site.kind === 'unsupported') {
    page.value = { status: 'unsupported', reason: site.reason, title: tab.title }
    return
  }

  page.value = {
    status: 'supported',
    title: tab.title || site.hostname,
    site,
  }
})
</script>

<template>
  <UApp :locale="uiLocale">
    <main class="w-[380px] p-4">
      <header class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2.5">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-inverted">
            <UIcon name="i-lucide-activity" class="size-5" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-sm font-semibold text-highlighted">
              {{ t('hello.title') }}
            </h1>
            <p class="truncate text-xs text-muted">
              {{ t('hello.subtitle') }}
            </p>
          </div>
        </div>

        <UButton
          icon="i-lucide-settings"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="t('popup.settings')"
          @click="openSettings"
        />
      </header>

      <UCard class="mt-4" :ui="{ body: 'p-4 sm:p-4' }">
        <div v-if="page.status === 'loading'" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
          {{ t('popup.loading') }}
        </div>

        <div v-else-if="page.status === 'supported'" class="min-w-0">
          <p class="text-xs font-medium text-dimmed">
            {{ t('popup.currentPage') }}
          </p>
          <h2 class="mt-1 line-clamp-2 text-base font-semibold text-highlighted">
            {{ page.title }}
          </h2>
          <p class="mt-1 truncate font-mono text-xs text-muted">
            {{ page.site.hostname }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
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

          <UAlert
            class="mt-4"
            color="neutral"
            variant="subtle"
            icon="i-lucide-construction"
            :title="t('popup.next.title')"
            :description="t('popup.next.hint')"
          />
        </div>

        <div v-else>
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
        </div>
      </UCard>
    </main>
  </UApp>
</template>
