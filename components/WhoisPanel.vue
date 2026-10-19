<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { lookupWhois } from '@/lib/api/whois'
import type { WhoisResult } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import { domainAgeMonths, formatDate, formatDomainAge, formatRetryAfter } from '@/lib/format'
import { WHOIS_STATUS_KEYS } from '@/lib/whois-status'
import type { Locale, Translate } from '@/lib/i18n'
import { translateApiError } from '@/lib/i18n/api-errors'

const props = defineProps<{
  hostname: string
  isIp: boolean
  locale: Locale
  t: Translate
}>()

const { status, data, error, fromCache, stale, load } = useCachedResource<WhoisResult>({
  cacheKey: () => cacheKey('whois', props.hostname),
  ttl: CACHE_TTL_MS.whois,
  enabled: () => !props.isIp && !!props.hostname,
  fetcher: () => lookupWhois(props.hostname),
})

const domainAge = computed(() => formatDomainAge(data.value?.dates.created, props.t))

/** 域名年龄配色：<1 年 warning，1–10 年 info，>=10 年 success */
const domainAgeColor = computed<'neutral' | 'warning' | 'info' | 'success'>(() => {
  const months = domainAgeMonths(data.value?.dates.created)
  if (months === null) return 'neutral'
  if (months < 12) return 'warning'
  if (months < 120) return 'info'
  return 'success'
})

const statusItems = computed(() => (data.value?.status ?? []).map((code) => ({
  code,
  key: WHOIS_STATUS_KEYS[code],
})))

const retryText = computed(() => {
  const current = error.value
  if (!current?.retryAfter) return ''
  if (current.key === 'api.rate.limited' || current.key === 'api.rate.limitedDaily') return ''
  return formatRetryAfter(current.retryAfter, props.t)
})

function errorText(): string {
  if (!error.value) return ''
  return translateApiError(error.value.key, error.value.args, props.locale, props.t)
}

function refresh() {
  return load(true)
}

onMounted(() => {
  void load()
})

defineExpose({ refresh })
</script>

<template>
  <section>
    <div v-if="isIp" class="text-sm text-muted">
      {{ t('whois.ipNote') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ t('whois.title') }}
          </h3>
          <p v-if="data" class="mt-0.5 truncate font-mono text-[11px] text-dimmed">
            {{ data.domainUnicode || data.domain }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UBadge v-if="fromCache && !stale" color="neutral" variant="subtle" size="sm">
            {{ t('popup.cached') }}
          </UBadge>
          <UBadge v-if="stale" color="warning" variant="subtle" size="sm">
            {{ t('popup.stale') }}
          </UBadge>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="status === 'loading'"
            :aria-label="t('popup.refresh')"
            @click="refresh"
          />
        </div>
      </div>

      <UAlert
        v-if="error && data"
        class="mt-2"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :description="errorText()"
      />
      <p v-if="retryText" class="mt-1 text-[11px] text-warning">
        {{ retryText }}
      </p>

      <div v-if="status === 'loading' && !data" class="mt-3 space-y-2">
        <USkeleton class="h-3 w-3/4" />
        <USkeleton class="h-3 w-1/2" />
      </div>

      <div v-else-if="status === 'error' && !data" class="mt-3">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="errorText()"
        />
        <UButton class="mt-2" size="xs" variant="soft" @click="refresh">
          {{ t('popup.retry') }}
        </UButton>
      </div>

      <div v-else-if="data" class="mt-3">
        <div v-if="!data.isRegistered" class="rounded-lg bg-elevated px-3 py-2">
          <p class="font-mono text-xs text-highlighted">{{ data.domainUnicode || data.domain }}</p>
          <p class="mt-1 text-xs text-muted">{{ t('whois.unregistered') }}</p>
        </div>

        <template v-else>
          <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
            <dt class="text-dimmed">{{ t('whois.registrar') }}</dt>
            <dd class="min-w-0 break-words text-highlighted">
              {{ data.registrar.name || t('common.none') }}
            </dd>

            <dt class="self-center text-dimmed">{{ t('whois.created') }}</dt>
            <dd class="flex flex-wrap items-center gap-1.5 text-highlighted">
              <span>{{ formatDate(data.dates.created, locale) }}</span>
              <UBadge v-if="domainAge" :color="domainAgeColor" variant="subtle" size="sm">
                {{ domainAge }}
              </UBadge>
            </dd>

            <dt class="text-dimmed">{{ t('whois.expires') }}</dt>
            <dd class="text-highlighted">{{ formatDate(data.dates.expires, locale) }}</dd>

            <dt class="text-dimmed">{{ t('whois.dnssec') }}</dt>
            <dd class="text-highlighted">
              {{ data.dnssec.signed ? t('whois.signed') : t('whois.unsigned') }}
            </dd>
          </dl>

          <div class="mt-3">
            <p class="text-xs font-medium text-dimmed">
              {{ t('whois.nameservers') }}
            </p>
            <ul v-if="data.nameservers.length" class="mt-1 space-y-1">
              <li
                v-for="ns in data.nameservers"
                :key="ns.name"
                class="min-w-0 truncate font-mono text-[11px] text-highlighted"
              >
                {{ ns.name }}
                <span v-if="ns.ipv4.length || ns.ipv6.length" class="text-dimmed">
                  · {{ [...ns.ipv4, ...ns.ipv6].join(', ') }}
                </span>
              </li>
            </ul>
            <p v-else class="mt-1 text-xs text-muted">
              {{ t('common.none') }}
            </p>
          </div>

          <div v-if="statusItems.length" class="mt-3">
            <p class="text-xs font-medium text-dimmed">
              {{ t('whois.status') }}
            </p>
            <div class="mt-1 flex flex-wrap gap-1">
              <template v-for="item in statusItems" :key="item.code">
                <UTooltip
                  v-if="item.key"
                  :text="t(item.key)"
                  :ui="{ content: 'h-auto max-w-64 px-3 py-2', text: 'whitespace-normal leading-relaxed' }"
                >
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    tabindex="0"
                    class="cursor-help font-mono"
                  >
                    {{ item.code }}
                  </UBadge>
                </UTooltip>
                <UBadge
                  v-else
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  class="font-mono"
                >
                  {{ item.code }}
                </UBadge>
              </template>
            </div>
          </div>
        </template>
      </div>
    </template>
  </section>
</template>
