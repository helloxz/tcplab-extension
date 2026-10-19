<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { checkTls } from '@/lib/api/tls'
import type { TlsCheckResult, TlsValidationIssue } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import { formatDate, formatRetryAfter } from '@/lib/format'
import { tlsVersionGrade } from '@/lib/tls-grade'
import type { Locale, MessageKey, Translate } from '@/lib/i18n'
import { translateApiError } from '@/lib/i18n/api-errors'

const props = defineProps<{
  hostname: string
  port: number
  isHttps: boolean
  isIp: boolean
  locale: Locale
  t: Translate
}>()

const issueKeys: Record<TlsValidationIssue, MessageKey> = {
  expired: 'tls.issue.expired',
  notYetValid: 'tls.issue.notYetValid',
  hostname: 'tls.issue.hostname',
  selfSigned: 'tls.issue.selfSigned',
  untrusted: 'tls.issue.untrusted',
  unknown: 'tls.issue.unknown',
}

function probeHost(): string {
  return props.isIp && props.hostname.includes(':') ? `[${props.hostname}]` : props.hostname
}

const { status, data, error, fromCache, stale, load } = useCachedResource<TlsCheckResult>({
  cacheKey: () => cacheKey('tls', props.hostname, String(props.port)),
  ttl: CACHE_TTL_MS.tls,
  enabled: () => !!props.hostname,
  fetcher: () => checkTls(probeHost(), props.port),
})

const issuesText = computed(() => {
  const issues = data.value?.validation.issues
  if (!issues?.length) return ''
  const separator = props.locale === 'zh' ? '；' : '; '
  return issues.map((issue) => props.t(issueKeys[issue])).join(separator)
})

const expiryText = computed(() => {
  const days = data.value?.certificate.daysRemaining
  if (days == null) return ''
  if (days < 0) return props.t('tls.expiredDays', { days: Math.abs(days) })
  if (days === 0) return props.t('tls.expiresToday')
  return props.t('tls.daysRemaining', { days })
})

const expiryColor = computed<'neutral' | 'error' | 'warning' | 'info' | 'success'>(() => {
  const days = data.value?.certificate.daysRemaining
  if (days == null) return 'neutral'
  if (days < 0) return 'error'
  if (days <= 30) return 'warning'
  if (days <= 60) return 'info'
  return 'success'
})

const publicKeyText = computed(() => {
  const cert = data.value?.certificate
  if (!cert) return ''
  return [cert.publicKeyAlgorithm, cert.publicKeyBits ? `${cert.publicKeyBits} bit` : '']
    .filter(Boolean)
    .join(' ')
})

/** TLS 版本配色：1.3 绿色、1.2 蓝色、1.0/1.1 及 SSL 橙色 */
const versionColor = computed<'neutral' | 'success' | 'info' | 'warning'>(() => {
  switch (tlsVersionGrade(data.value?.connection.version)) {
    case 'modern':
      return 'success'
    case 'acceptable':
      return 'info'
    case 'deprecated':
      return 'warning'
    default:
      return 'neutral'
  }
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
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-highlighted">
          {{ t('tls.title') }}
        </h3>
        <p v-if="data" class="mt-0.5 truncate font-mono text-[11px] text-dimmed">
          {{ data.host }}:{{ data.port }}
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

    <p v-if="!isHttps" class="mt-1 text-[11px] text-dimmed">
      {{ t('popup.httpTlsNote') }}
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
      <USkeleton class="h-3 w-2/3" />
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
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="data.validation.valid ? 'success' : 'error'"
          variant="subtle"
          size="sm"
        >
          {{ data.validation.valid ? t('tls.valid') : t('tls.invalid') }}
        </UBadge>
      </div>

      <UAlert
        v-if="!data.validation.valid && issuesText"
        class="mt-2"
        color="error"
        variant="subtle"
        icon="i-lucide-shield-alert"
        :description="issuesText"
      />

      <div class="mt-3">
        <p class="text-xs font-medium text-dimmed">
          {{ t('tls.certificate') }}
        </p>
        <dl class="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt class="text-dimmed">{{ t('tls.subject') }}</dt>
          <dd class="min-w-0 break-words text-highlighted">
            {{ data.certificate.subject || t('common.none') }}
          </dd>

          <dt class="text-dimmed">{{ t('tls.issuer') }}</dt>
          <dd class="min-w-0 break-words text-highlighted">
            {{ data.certificate.issuer || t('common.none') }}
          </dd>

          <dt class="text-dimmed">{{ t('tls.validFrom') }}</dt>
          <dd class="text-highlighted">{{ formatDate(data.certificate.validFrom, locale) }}</dd>

          <dt class="self-center text-dimmed">{{ t('tls.validTo') }}</dt>
          <dd class="flex flex-wrap items-center gap-1.5 text-highlighted">
            <span>{{ formatDate(data.certificate.validTo, locale) }}</span>
            <UBadge v-if="expiryText" :color="expiryColor" variant="subtle" size="sm">
              {{ expiryText }}
            </UBadge>
          </dd>

          <template v-if="publicKeyText">
            <dt class="text-dimmed">{{ t('tls.publicKey') }}</dt>
            <dd class="text-highlighted">{{ publicKeyText }}</dd>
          </template>
        </dl>

        <details v-if="data.certificate.san.length" class="mt-2">
          <summary class="cursor-pointer text-xs font-medium text-dimmed">
            {{ t('tls.san', { count: data.certificate.san.length }) }}
          </summary>
          <ul class="mt-1 space-y-1">
            <li
              v-for="name in data.certificate.san"
              :key="name"
              class="break-all font-mono text-[11px] text-muted"
            >
              {{ name }}
            </li>
          </ul>
        </details>
      </div>

      <div class="mt-3">
        <p class="text-xs font-medium text-dimmed">
          {{ t('tls.connection') }}
        </p>
        <dl class="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt class="self-center text-dimmed">{{ t('tls.version') }}</dt>
          <dd class="text-highlighted">
            <UBadge :color="versionColor" variant="subtle" size="sm">
              {{ data.connection.version }}
            </UBadge>
          </dd>

          <dt class="text-dimmed">{{ t('tls.cipher') }}</dt>
          <dd class="min-w-0 break-words font-mono text-[11px] text-highlighted">
            {{ data.connection.cipher }}
          </dd>

          <dt class="self-center text-dimmed">{{ t('tls.forwardSecrecy') }}</dt>
          <dd class="text-highlighted">
            <UBadge
              :color="data.connection.forwardSecrecy ? 'success' : 'warning'"
              variant="subtle"
              size="sm"
            >
              {{ data.connection.forwardSecrecy ? t('common.yes') : t('common.no') }}
            </UBadge>
          </dd>

          <dt class="text-dimmed">{{ t('tls.alpn') }}</dt>
          <dd class="text-highlighted">{{ data.connection.alpn || t('common.none') }}</dd>

          <dt class="self-center text-dimmed">{{ t('tls.http2') }}</dt>
          <dd class="text-highlighted">
            <UBadge
              :color="data.connection.http2 ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ data.connection.http2 ? t('common.yes') : t('common.no') }}
            </UBadge>
          </dd>

          <dt class="text-dimmed">{{ t('tls.ipAddress') }}</dt>
          <dd class="font-mono text-[11px] text-highlighted">{{ data.ip }}</dd>
        </dl>
      </div>

    </div>
  </section>
</template>
