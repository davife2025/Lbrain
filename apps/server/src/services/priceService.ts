/**
 * apps/server/src/services/priceService.ts
 * Caches and fetches live LBank prices server-side.
 * Used by alert and agent engines.
 */

import { getTicker, getTopMovers } from '@lbrain/lbank-skills'

interface CachedPrice {
  price:     number
  changePct: number
  high:      number
  low:       number
  fetchedAt: number
}

class PriceService {
  private cache = new Map<string, CachedPrice>()
  private TTL   = 15_000 // 15s cache

  async getPrice(symbol: string): Promise<number> {
    const cached = this.cache.get(symbol)
    if (cached && Date.now() - cached.fetchedAt < this.TTL) {
      return cached.price
    }

    try {
      const ticker = await getTicker(symbol)
      this.cache.set(symbol, {
        price:     ticker.price,
        changePct: ticker.changePct,
        high:      ticker.high,
        low:       ticker.low,
        fetchedAt: Date.now(),
      })
      return ticker.price
    } catch (err: any) {
      // Return cached even if stale on error
      if (cached) return cached.price
      throw new Error(`Failed to fetch price for ${symbol}: ${err.message}`)
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {}
    await Promise.allSettled(
      symbols.map(async sym => {
        try {
          results[sym] = await this.getPrice(sym)
        } catch {}
      })
    )
    return results
  }

  async getTopMoversServer(limit = 10) {
    return await getTopMovers(limit)
  }

  clearCache() {
    this.cache.clear()
  }
}

export const priceService = new PriceService()
