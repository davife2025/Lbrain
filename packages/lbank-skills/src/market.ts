/**
 * packages/lbank-skills/src/market.ts
 * LBank public market data skills.
 * No authentication required.
 */

import { publicClient, toSymbol } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface LBankTicker {
  symbol:       string
  price:        number
  high:         number
  low:          number
  volume:       number
  change:       number
  changePct:    number
  open:         number
  close:        number
  turnover:     number
  timestamp:    number
}

export interface LBankOrderBook {
  symbol: string
  bids:   [number, number][] // [price, amount]
  asks:   [number, number][]
  time:   number
}

export interface LBankKline {
  time:   number
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
}

export interface LBankTrade {
  id:        string
  time:      number
  price:     number
  amount:    number
  type:      'buy' | 'sell'
}

// ── Skills ─────────────────────────────────────────────────────────────────

/**
 * SKILL: get_ticker
 * Get 24hr ticker for a single trading pair
 */
export async function getTicker(symbol: string): Promise<LBankTicker> {
  const sym = toSymbol(symbol)
  const { data } = await publicClient.get('/v2/ticker.do', {
    params: { symbol: sym },
  })

  if (!data || !data.data) throw new Error(`Ticker not found for ${symbol}`)

  const t = Array.isArray(data.data) ? data.data[0] : data.data
  return {
    symbol:    sym,
    price:     parseFloat(t.ticker?.latest  ?? t.close ?? 0),
    high:      parseFloat(t.ticker?.high    ?? t.high  ?? 0),
    low:       parseFloat(t.ticker?.low     ?? t.low   ?? 0),
    volume:    parseFloat(t.ticker?.vol     ?? t.vol   ?? 0),
    change:    parseFloat(t.ticker?.change  ?? 0),
    changePct: parseFloat(t.ticker?.change  ?? 0),
    open:      parseFloat(t.ticker?.opening ?? 0),
    close:     parseFloat(t.ticker?.latest  ?? 0),
    turnover:  parseFloat(t.ticker?.turnover ?? 0),
    timestamp: t.timestamp ?? Date.now(),
  }
}

/**
 * SKILL: get_all_tickers
 * Get 24hr tickers for all trading pairs
 */
export async function getAllTickers(): Promise<LBankTicker[]> {
  const { data } = await publicClient.get('/v2/ticker.do', {
    params: { symbol: 'all' },
  })

  if (!Array.isArray(data.data)) return []

  return data.data.map((t: any) => ({
    symbol:    t.symbol,
    price:     parseFloat(t.ticker?.latest   ?? 0),
    high:      parseFloat(t.ticker?.high     ?? 0),
    low:       parseFloat(t.ticker?.low      ?? 0),
    volume:    parseFloat(t.ticker?.vol      ?? 0),
    change:    parseFloat(t.ticker?.change   ?? 0),
    changePct: parseFloat(t.ticker?.change   ?? 0),
    open:      parseFloat(t.ticker?.opening  ?? 0),
    close:     parseFloat(t.ticker?.latest   ?? 0),
    turnover:  parseFloat(t.ticker?.turnover ?? 0),
    timestamp: t.timestamp ?? Date.now(),
  }))
}

/**
 * SKILL: get_top_movers
 * Get top gaining and losing pairs by % change
 */
export async function getTopMovers(limit = 10): Promise<{ gainers: LBankTicker[]; losers: LBankTicker[] }> {
  const all = await getAllTickers()
  const usdtPairs = all.filter(t => t.symbol.endsWith('_usdt'))
  const sorted    = [...usdtPairs].sort((a, b) => b.changePct - a.changePct)

  return {
    gainers: sorted.slice(0, limit),
    losers:  sorted.slice(-limit).reverse(),
  }
}

/**
 * SKILL: get_order_book
 * Get order book depth for a trading pair
 */
export async function getOrderBook(symbol: string, size = 10): Promise<LBankOrderBook> {
  const sym = toSymbol(symbol)
  const { data } = await publicClient.get('/v1/depth.do', {
    params: { symbol: sym, size },
  })

  return {
    symbol: sym,
    bids:   (data.bids ?? []).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
    asks:   (data.asks ?? []).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
    time:   Date.now(),
  }
}

/**
 * SKILL: get_klines
 * Get candlestick data for a trading pair
 * Intervals: minute1, minute5, minute15, minute30, hour1, hour4, hour8, hour12, day1, week1, month1
 */
export async function getKlines(
  symbol:   string,
  interval: string = 'hour1',
  size:     number = 100
): Promise<LBankKline[]> {
  const sym = toSymbol(symbol)
  const { data } = await publicClient.get('/v1/kline.do', {
    params: {
      symbol: sym,
      size,
      type:  interval,
      time:  Math.floor(Date.now() / 1000),
    },
  })

  if (!Array.isArray(data)) return []

  return data.map((k: number[]) => ({
    time:   k[0],
    open:   k[1],
    high:   k[2],
    low:    k[3],
    close:  k[4],
    volume: k[5],
  }))
}

/**
 * SKILL: get_recent_trades
 * Get recent trades for a trading pair
 */
export async function getRecentTrades(symbol: string, size = 50): Promise<LBankTrade[]> {
  const sym = toSymbol(symbol)
  const { data } = await publicClient.get('/v1/trades.do', {
    params: { symbol: sym, size },
  })

  if (!Array.isArray(data)) return []

  return data.map((t: any) => ({
    id:     t.tid,
    time:   t.date_ms,
    price:  parseFloat(t.price),
    amount: parseFloat(t.amount),
    type:   t.type as 'buy' | 'sell',
  }))
}

/**
 * SKILL: get_trading_pairs
 * Get all available trading pairs on LBank
 */
export async function getTradingPairs(): Promise<string[]> {
  const { data } = await publicClient.get('/v1/currencyPairs.do')
  return Array.isArray(data) ? data : []
}

/**
 * SKILL: get_market_summary
 * Get a clean market summary for a symbol — price, change, volume, high, low
 * Great for AI responses
 */
export async function getMarketSummary(symbol: string): Promise<{
  symbol:    string
  price:     number
  change:    string
  high:      number
  low:       number
  volume:    number
  sentiment: 'bullish' | 'bearish' | 'neutral'
}> {
  const ticker = await getTicker(symbol)
  return {
    symbol:    ticker.symbol.toUpperCase(),
    price:     ticker.price,
    change:    `${ticker.changePct >= 0 ? '+' : ''}${ticker.changePct.toFixed(2)}%`,
    high:      ticker.high,
    low:       ticker.low,
    volume:    ticker.volume,
    sentiment: ticker.changePct > 1 ? 'bullish' : ticker.changePct < -1 ? 'bearish' : 'neutral',
  }
}
