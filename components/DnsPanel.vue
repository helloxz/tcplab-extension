<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { getDnsDomain } from '@/lib/api/dns'
import type { DnsDomainResult } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import { formatDuration, formatRetryAfter, formatTime } from '@/lib/format'
import type { Locale, Translate } from '@/lib/i18n'
import { translateApiError } from '@/lib/i18n/api-errors'

const props = defineProps<{
  hostname: string
  isIp: boolean
  locale: Locale
  t: Translate
}>()

const { status, data, error, fromCache, stale, fetchedAt, load } = useCachedResource<DnsDomainResult>({
  cacheKey: () => cacheKey('dns', props.hostname),
  ttl: CACHE_TTL_MS.dns,
  enabled: () => !props.isIp && !!props.hostname,
  fetcher: () => getDnsDomain(props.hostname),
})

const groups = computed(() => {
  if (!data.value) return []
  return [
    { label: 'A', records: data.value.a },
    { label: 'AAAA', records: data.value.aaaa },
  ]
})

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
      {{ t('dns.ipNote') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ t('dns.title') }}
          </h3>
          <p v-if="data" class="mt-0.5 truncate text-[11px] text-dimmed">
            {{ data.server.label }} · {{ data.server.ip }}
            <span v-if="data.elapsed"> · {{ formatDuration(data.elapsed) }}</span>
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

      <p v-if="fetchedAt" class="mt-1 text-[11px] text-dimmed">
        {{ t('popup.updatedAt', { time: formatTime(fetchedAt, locale) }) }}
      </p>

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

      <div v-else-if="data" class="mt-3 space-y-3">
        <div v-for="group in groups" :key="group.label">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-dimmed">
              {{ group.label }}
            </p>
            <span class="text-[11px] text-dimmed">{{ group.records.length }}</span>
          </div>
          <ul v-if="group.records.length" class="mt-1 space-y-1">
            <li
              v-for="record in group.records"
              :key="`${record.type}:${record.value}:${record.ttl}`"
              class="flex items-baseline justify-between gap-2 rounded bg-elevated px-2 py-1 font-mono text-[11px]"
            >
              <span class="min-w-0 truncate text-highlighted">{{ record.value }}</span>
              <span class="shrink-0 text-dimmed">TTL {{ record.ttl }}</span>
            </li>
          </ul>
          <p v-else class="mt-1 text-xs text-muted">
            {{ t('dns.empty') }}
          </p>
        </div>
      </div>
    </template>
  </section>
</template>
