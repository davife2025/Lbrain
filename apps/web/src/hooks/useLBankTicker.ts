'use client'

/**
 * apps/web/src/hooks/useLBankTicker.ts
 * React hook for live LBank price streaming via WebSocket.
 * Auto-reconnects, cleans up on unmount.
 */

import { useState, useEffect, useRef } from 'react'

export interface LiveTicker {
  symbol:    string
  price:     number
  high:      number
  low:       number
  volume:    number
  changePct: number
  direction: 'up' | 'down' | 'flat'
}

type WsStatus = 'connecting' | 'connected' | 'disconnected'

const WS_BASE = 'wss://www.lbkex.net/ws/V2/'

export function useLBankTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Record<string, LiveTicker>>({})
  const [status,  setStatus]  = useState<WsStatus>('connecting')
  const wsRef     = useRef<WebSocket | null>(null)
  const prevPrice = useRef<Record<string, number>>({})
  const dead      = useRef(false)
  const retries   = useRef(0)

  useEffect(() => {
    if (!symbols.length) return
    dead.current = false
    connect()
    return () => {
      dead.current = true
      wsRef.current?.close()
    }
  }, [symbols.join(',')])

  function connect() {
    if (dead.current) return
    setStatus('connecting')

    const ws = new WebSocket(WS_BASE)
    wsRef.current = ws

    ws.onopen = () => {
      retries.current = 0
      setStatus('connected')
      symbols.forEach(sym => {
        ws.send(JSON.stringify({ action: 'subscribe', subscribe: 'tick', pair: sym.toLowerCase() }))
      })
    }

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        // Respond to ping
        if (msg.ping) { ws.send(JSON.stringify({ pong: msg.ping })); return }
        if (msg.type !== 'tick' || !msg.tick) return

        const sym   = msg.pair ?? ''
        const price = parseFloat(msg.tick.latest  ?? 0)
        const prev  = prevPrice.current[sym] ?? price
        const dir   = price > prev ? 'up' : price < prev ? 'down' : 'flat'
        prevPrice.current[sym] = price

        setTickers(t => ({
          ...t,
          [sym]: {
            symbol:    sym,
            price,
            high:      parseFloat(msg.tick.high    ?? 0),
            low:       parseFloat(msg.tick.low     ?? 0),
            volume:    parseFloat(msg.tick.vol     ?? 0),
            changePct: parseFloat(msg.tick.change  ?? 0),
            direction: dir,
          },
        }))
      } catch {}
    }

    ws.onclose = () => {
      if (dead.current) return
      setStatus('disconnected')
      if (retries.current < 10) {
        retries.current++
        setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => ws.close()
  }

  return { tickers, status }
}

/**
 * Single symbol convenience hook
 */
export function useSingleTicker(symbol: string) {
  const { tickers, status } = useLBankTicker([symbol])
  return { ticker: tickers[symbol] ?? null, status }
}
