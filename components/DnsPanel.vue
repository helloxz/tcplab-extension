<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { useIpGeo } from '@/composables/useIpGeo'
import { getDnsDomain } from '@/lib/api/dns'
import type { DnsDomainResult, DnsRecord, IpLookupResult } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import { formatIpLocation, formatRetryAfter } from '@/lib/format'
import type { Locale, Translate } from '@/lib/i18n'
import { translateApiError } from '@/lib/i18n/api-errors'

const props = defineProps<{
  hostname: string
  isIp: boolean
  locale: Locale
  t: Translate
}>()

const { status, data, error, fromCache, stale, load } = useCachedResource<DnsDomainResult>({
  cacheKey: () => cacheKey('dns', props.hostname),
  ttl: CACHE_TTL_MS.dns,
  enabled: () => !props.isIp && !!props.hostname,
  fetcher: () => getDnsDomain(props.hostname),
})

const firstV4 = computed(() => data.value?.a[0]?.value ?? null)
const firstV6 = computed(() => data.value?.aaaa[0]?.value ?? null)

// 只查询第一条 A / AAAA 的归属地，控制额外请求数量；失败时静默隐藏
const geoV4 = useIpGeo(() => firstV4.value, () => props.locale)
const geoV6 = useIpGeo(() => firstV6.value, () => props.locale)

/** 只在归属结果与当前首条记录 IP 一致时展示，避免刷新瞬间张冠李戴 */
function geoText(geo: IpLookupResult | null, ip: string | null): string {
  if (!geo || !ip || geo.ip !== ip) return ''
  return formatIpLocation(geo)
}

type DnsGroupLabel = 'A' | 'AAAA'

// 默认每组只展示第一条，其余记录按需展开
const expanded = ref<Record<DnsGroupLabel, boolean>>({ A: false, AAAA: false })

function toggleGroup(label: DnsGroupLabel) {
  expanded.value[label] = !expanded.value[label]
}

function visibleRecords(label: DnsGroupLabel, records: DnsRecord[]): DnsRecord[] {
  return expanded.value[label] ? records : records.slice(0, 1)
}

const groups = computed(() => {
  if (!data.value) return []
  return [
    {
      label: 'A' as const,
      records: data.value.a,
      visible: visibleRecords('A', data.value.a),
      geo: geoText(geoV4.data.value, firstV4.value),
    },
    {
      label: 'AAAA' as const,
      records: data.value.aaaa,
      visible: visibleRecords('AAAA', data.value.aaaa),
      geo: geoText(geoV6.data.value, firstV6.value),
    },
  ]
})

const retryText = computed(() => {
  const current = error.value
  if (!current?.retryAfter) return ''
  if (current.key === 'api.rate.limited' || current.key === 'api.rate.limitedDaily') return ''
  return formatRetryAfter(current.retryAfter, props.t)
})

/** 复制成功后的 IP，用于短暂显示对勾 */
const copiedIp = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 剪贴板 API 不可用时回退到 execCommand
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      try {
        area.select()
        return document.execCommand('copy')
      } finally {
        area.remove()
      }
    } catch {
      return false
    }
  }
}

async function copyIp(value: string) {
  if (!(await copyText(value))) return
  copiedIp.value = value
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copiedIp.value = null
  }, 1500)
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})

function errorText(): string {
  if (!error.value) return ''
  return translateApiError(error.value.key, error.value.args, props.locale, props.t)
}

async function refresh() {
  await load(true)
  // 手动刷新同样绕过归属地缓存；IP 变化时 useIpGeo 的 watch 也会触发加载
  await Promise.all([geoV4.refresh(), geoV6.refresh()])
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

      <div v-else-if="data" class="mt-3 space-y-3">
        <div v-for="group in groups" :key="group.label">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-medium text-dimmed">
              {{ group.label }}
            </p>
            <button
              v-if="group.records.length > 1"
              type="button"
              class="flex items-center gap-0.5 rounded text-[11px] text-dimmed transition hover:text-primary"
              :aria-label="expanded[group.label] ? t('dns.collapse') : t('dns.expand')"
              :aria-expanded="expanded[group.label]"
              :title="expanded[group.label] ? t('dns.collapse') : t('dns.expand')"
              @click="toggleGroup(group.label)"
            >
              <span>{{ group.records.length }}</span>
              <UIcon
                :name="expanded[group.label] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-3"
              />
            </button>
            <span v-else class="text-[11px] text-dimmed">{{ group.records.length }}</span>
          </div>
          <ul v-if="group.records.length" class="mt-1 space-y-1">
            <li
              v-for="(record, index) in group.visible"
              :key="`${record.type}:${record.value}:${record.ttl}`"
              class="rounded bg-elevated px-2 py-1 font-mono text-[11px]"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 truncate text-highlighted">{{ record.value }}</span>
                <button
                  type="button"
                  class="-mr-1 shrink-0 rounded p-0.5 transition"
                  :class="copiedIp === record.value ? 'text-success' : 'text-dimmed hover:text-primary'"
                  :aria-label="copiedIp === record.value ? t('common.copied') : t('common.copy')"
                  :title="copiedIp === record.value ? t('common.copied') : t('common.copy')"
                  @click="copyIp(record.value)"
                >
                  <UIcon
                    :name="copiedIp === record.value ? 'i-lucide-check' : 'i-lucide-copy'"
                    class="size-3.5"
                  />
                </button>
              </div>
              <p
                v-if="index === 0 && group.geo"
                class="mt-1 flex items-start gap-1 font-sans text-[10px] text-muted"
                :title="group.geo"
              >
                <UIcon name="i-lucide-map-pin" class="mt-px size-3 shrink-0" />
                <span class="min-w-0 truncate">{{ group.geo }}</span>
              </p>
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
