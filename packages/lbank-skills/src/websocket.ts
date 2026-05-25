/**
 * packages/lbank-skills/src/websocket.ts
 * LBank WebSocket streams — client-side only.
 * Streams: ticker, depth (orderbook), trades, kline, account (auth)
 */

'use client'

import { LBANK_WS_BASE } from './client'

type WsStatus = 'connecting' | 'connected' | 'disconnected'

interface LBankWsMessage {
  type:   string
  pair?:  string
  trade?: any
  tick?:  any
  depth?: any
  kline?: any
  ping?:  string
}

// ── Base WebSocket manager ─────────────────────────────────────────────────

class LBankWebSocket {
  private ws:             WebSocket | null = null
  private dead:           boolean = false
  private reconnects:     number  = 0
  private maxReconnects:  number  = 10
  private reconnectDelay: number  = 3000
  private timer:          ReturnType<typeof setTimeout> | null = null
  private onMsg:          (data: LBankWsMessage) => void
  private onStatus:       (s: WsStatus) => void
  private subscriptions:  object[]

  constructor(
    onMsg:    (data: LBankWsMessage) => void,
    onStatus: (s: WsStatus) => void,
    subs:     object[]
  ) {
    this.onMsg          = onMsg
    this.onStatus       = onStatus
    this.subscriptions  = subs
    this.connect()
  }

  private connect() {
    if (this.dead) return
    this.onStatus('connecting')
    this.ws = new WebSocket(LBANK_WS_BASE)

    this.ws.onopen = () => {
      this.reconnects = 0
      this.onStatus('connected')
      // Subscribe to all requested streams
      this.subscriptions.forEach(sub => {
        this.ws?.send(JSON.stringify(sub))
      })
    }

    this.ws.onmessage = e => {
      try {
        const msg: LBankWsMessage = JSON.parse(e.data)
        // Respond to ping
        if (msg.ping) {
          this.ws?.send(JSON.stringify({ pong: msg.ping }))
          return
        }
        this.onMsg(msg)
      } catch {}
    }

    this.ws.onclose = () => {
      if (this.dead) return
      this.onStatus('disconnected')
      if (this.reconnects < this.maxReconnects) {
        this.reconnects++
        this.timer = setTimeout(() => this.connect(), this.reconnectDelay)
      }
    }

    this.ws.onerror = () => { this.ws?.close() }
  }

  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  close() {
    this.dead = true
    if (this.timer) clearTimeout(this.timer)
    this.ws?.close()
  }
}

// ── Stream factories ───────────────────────────────────────────────────────

export interface TickerUpdate {
  symbol:    string
  price:     number
  high:      number
  low:       number
  volume:    number
  changePct: number
}

/**
 * SKILL: subscribe_ticker
 * Stream real-time ticker updates for one or more symbols
 */
export function createTickerStream(
  symbols:  string[],
  onTick:   (data: TickerUpdate) => void,
  onStatus?: (s: WsStatus) => void
) {
  const subs = symbols.map(sym => ({
    action:    'subscribe',
    subscribe: 'tick',
    pair:      sym.toLowerCase(),
  }))

  return new LBankWebSocket(
    msg => {
      if (msg.type === 'tick' && msg.tick) {
        onTick({
          symbol:    msg.pair ?? '',
          price:     parseFloat(msg.tick.latest  ?? 0),
          high:      parseFloat(msg.tick.high    ?? 0),
          low:       parseFloat(msg.tick.low     ?? 0),
          volume:    parseFloat(msg.tick.vol     ?? 0),
          changePct: parseFloat(msg.tick.change  ?? 0),
        })
      }
    },
    onStatus ?? (() => {}),
    subs
  )
}

export interface DepthUpdate {
  symbol: string
  bids:   [number, number][]
  asks:   [number, number][]
}

/**
 * SKILL: subscribe_orderbook
 * Stream real-time order book depth for a symbol
 */
export function createDepthStream(
  symbol:   string,
  onDepth:  (data: DepthUpdate) => void,
  onStatus?: (s: WsStatus) => void
) {
  const sub = {
    action:    'subscribe',
    subscribe: 'depth',
    depth:     '10',
    pair:      symbol.toLowerCase(),
  }

  return new LBankWebSocket(
    msg => {
      if (msg.type === 'depth' && msg.depth) {
        onDepth({
          symbol: symbol,
          bids:   (msg.depth.bids ?? []).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
          asks:   (msg.depth.asks ?? []).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
        })
      }
    },
    onStatus ?? (() => {}),
    [sub]
  )
}

export interface TradeUpdate {
  symbol: string
  price:  number
  amount: number
  type:   'buy' | 'sell'
  time:   number
}

/**
 * SKILL: subscribe_trades
 * Stream real-time trade updates for a symbol
 */
export function createTradeStream(
  symbol:   string,
  onTrade:  (data: TradeUpdate) => void,
  onStatus?: (s: WsStatus) => void
) {
  const sub = {
    action:    'subscribe',
    subscribe: 'trade',
    pair:      symbol.toLowerCase(),
  }

  return new LBankWebSocket(
    msg => {
      if (msg.type === 'trade' && msg.trade) {
        onTrade({
          symbol: symbol,
          price:  parseFloat(msg.trade.price  ?? 0),
          amount: parseFloat(msg.trade.amount ?? 0),
          type:   msg.trade.type as 'buy' | 'sell',
          time:   msg.trade.TS ?? Date.now(),
        })
      }
    },
    onStatus ?? (() => {}),
    [sub]
  )
}
