import { beforeEach, describe, expect, it, vi } from 'vitest'

const { store, getItem, setItem } = vi.hoisted(() => {
  const store = new Map<string, unknown>()
  return {
    store,
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value)
    }),
  }
})

vi.mock('wxt/utils/storage', () => ({
  storage: { getItem, setItem },
}))

import { ApiError } from '@/lib/api/client'
import { cacheKey } from '@/lib/cache'
import { useCachedResource } from './useCachedResource'

const KEY = cacheKey('dns', 'example.com')
const STORAGE_KEY = `local:${KEY}`

describe('useCachedResource', () => {
  beforeEach(() => {
    store.clear()
    getItem.mockClear()
    setItem.mockClear()
  })

  it('uses a fresh cache without fetching', async () => {
    store.set(STORAGE_KEY, { data: { value: 1 }, fetchedAt: Date.now() })
    const fetcher = vi.fn(async () => ({ value: 2 }))

    const resource = useCachedResource({ cacheKey: KEY, ttl: 60_000, fetcher })
    await resource.load()

    expect(fetcher).not.toHaveBeenCalled()
    expect(resource.data.value).toEqual({ value: 1 })
    expect(resource.fromCache.value).toBe(true)
    expect(resource.stale.value).toBe(false)
    expect(resource.status.value).toBe('success')
  })

  it('keeps stale data and exposes retry-after when refresh is rate-limited', async () => {
    store.set(STORAGE_KEY, { data: { value: 1 }, fetchedAt: Date.now() - 120_000 })
    const fetcher = vi.fn(async () => {
      throw new ApiError('api.rate.limited', {
        args: { seconds: 60 },
        retryAfter: 60,
      })
    })

    const resource = useCachedResource({ cacheKey: KEY, ttl: 60_000, fetcher })
    await resource.load()

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(resource.data.value).toEqual({ value: 1 })
    expect(resource.stale.value).toBe(true)
    expect(resource.status.value).toBe('success')
    expect(resource.error.value?.key).toBe('api.rate.limited')
    expect(resource.error.value?.retryAfter).toBe(60)
  })

  it('force refresh bypasses a fresh cache', async () => {
    store.set(STORAGE_KEY, { data: { value: 1 }, fetchedAt: Date.now() })
    const fetcher = vi.fn(async () => ({ value: 2 }))

    const resource = useCachedResource({ cacheKey: KEY, ttl: 60_000, fetcher })
    await resource.load(true)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(resource.data.value).toEqual({ value: 2 })
    expect(resource.fromCache.value).toBe(false)
    expect(store.get(STORAGE_KEY)).toMatchObject({ data: { value: 2 } })
  })
})
