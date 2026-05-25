'use client'

/**
 * apps/web/src/hooks/useLBankOrderBook.ts
 * React hook for live order book depth via WebSocket.
 */

import { useState, useEffect, useRef } from 'react'

export interface OrderBookEntry {
  price:  number
  amount: number
  total:  number
}

export interface LiveOrderBook {
  symbol: string
  bids:   OrderBookEntry[]
  asks:   OrderBookEntry[]
  spread: number
  midPrice: number
}

const WS_BASE = 'wss://www.lbkex.net/ws/V2/'

export function useLBankOrderBook(symbol: string, depth = 10) {
  const [book,   setBook]   = useState<LiveOrderBook | null>(null)
  const [status, setStatus] = useState<'connecting'|'connected'|'disconnected'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const dead  = useRef(false)

  useEffect(() => {
    if (!symbol) return
    dead.current = false
    connect()
    return () => { dead.current = true; wsRef.current?.close() }
  }, [symbol])

  function connect() {
    if (dead.current) return
    setStatus('connecting')
    const ws = new WebSocket(WS_BASE)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      ws.send(JSON.stringify({ action: 'subscribe', subscribe: 'depth', depth: String(depth), pair: symbol.toLowerCase() }))
    }

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.ping) { ws.send(JSON.stringify({ pong: msg.ping })); return }
        if (msg.type !== 'depth' || !msg.depth) return

        const parse = (arr: string[][]): OrderBookEntry[] => {
          let cumTotal = 0
          return arr.map(([p, a]) => {
            const price  = parseFloat(p)
            const amount = parseFloat(a)
            cumTotal += amount
            return { price, amount, total: cumTotal }
          })
        }

        const bids = parse((msg.depth.bids ?? []).slice(0, depth))
        const asks = parse((msg.depth.asks ?? []).slice(0, depth))

        const topBid  = bids[0]?.price ?? 0
        const topAsk  = asks[0]?.price ?? 0
        const spread  = topAsk - topBid
        const midPrice = (topBid + topAsk) / 2

        setBook({ symbol, bids, asks, spread, midPrice })
      } catch {}
    }

    ws.onclose = () => {
      if (dead.current) return
      setStatus('disconnected')
      setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }

  return { book, status }
}
