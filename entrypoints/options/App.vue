<script setup lang="ts">
import { computed, ref } from 'vue'
import { en as enLocale, zh_cn as zhLocale } from '@nuxt/ui/locale'
import { useI18n, type LocalePreference } from '@/lib/i18n'

const { locale, preference, t, setPreference } = useI18n()

const uiLocale = computed(() => (locale.value === 'zh' ? zhLocale : enLocale))

const version = browser.runtime.getManifest().version
const repositoryUrl = 'https://github.com/helloxz/tcplab-extension'
const issuesUrl = `${repositoryUrl}/issues`
const licenseUrl = `${repositoryUrl}/blob/main/LICENSE`
const privacyUrl = computed(() => (
  locale.value === 'zh'
    ? 'https://tcp.lc/zh/page/privacy'
    : 'https://tcp.lc/page/privacy'
))

const items = computed(() => [
  { label: t('options.language.auto'), value: 'auto' },
  { label: t('options.language.zh'), value: 'zh' },
  { label: t('options.language.en'), value: 'en' },
])

const saved = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | undefined

function isLocalePreference(value: string): value is LocalePreference {
  return value === 'auto' || value === 'zh' || value === 'en'
}

async function updateLanguage(value: string) {
  if (!isLocalePreference(value)) return
  await setPreference(value)
  saved.value = true
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => {
    saved.value = false
  }, 1600)
}
</script>

<template>
  <UApp :locale="uiLocale">
    <main class="mx-auto max-w-xl p-6">
      <header class="flex items-center gap-3">
        <img
          src="/icon/128.png"
          alt="TCPLab"
          class="size-10 shrink-0 object-contain"
        >
        <div>
          <h1 class="text-lg font-semibold text-highlighted">
            {{ t('options.title') }}
          </h1>
          <p class="text-sm text-muted">
            {{ t('app.subtitle') }}
          </p>
        </div>
      </header>

      <UCard class="mt-6">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-highlighted" for="language">
            {{ t('options.language') }}
          </label>
          <USelect
            id="language"
            :model-value="preference"
            :items="items"
            class="w-full sm:w-64"
            @update:model-value="updateLanguage"
          />
          <p class="text-xs text-muted">
            {{ t('options.languageHint') }}
          </p>
          <p v-if="saved" class="text-xs font-medium text-success">
            {{ t('options.saved') }}
          </p>
        </div>
      </UCard>

      <footer class="mt-6 border-t border-default pt-4">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dimmed">
          <span class="font-mono">{{ t('options.about.version', { version }) }}</span>
          <span aria-hidden="true">·</span>
          <a
            :href="repositoryUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-highlighted hover:underline"
          >
            {{ t('options.about.source') }}
          </a>
          <span aria-hidden="true">·</span>
          <a
            :href="issuesUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-highlighted hover:underline"
          >
            {{ t('options.about.issues') }}
          </a>
          <span aria-hidden="true">·</span>
          <a
            :href="licenseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-highlighted hover:underline"
          >
            {{ t('options.about.license') }}
          </a>
          <span aria-hidden="true">·</span>
          <a
            :href="privacyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:text-highlighted hover:underline"
          >
            {{ t('options.about.privacy') }}
          </a>
        </div>
      </footer>
    </main>
  </UApp>
</template>
