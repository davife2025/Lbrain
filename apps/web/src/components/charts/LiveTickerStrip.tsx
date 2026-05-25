'use client'

/**
 * apps/web/src/components/charts/LiveTickerStrip.tsx
 * Horizontal scrolling live price strip — shown on dashboard
 */

import { useEffect, useRef } from 'react'
import { useLBankTicker } from '@/hooks/useLBankTicker'

const SYMBOLS = [
  'btc_usdt','eth_usdt','ltc_usdt','xrp_usdt',
  'bnb_usdt','sol_usdt','doge_usdt','ada_usdt',
  'dot_usdt','link_usdt',
]

export default function LiveTickerStrip() {
  const { tickers } = useLBankTicker(SYMBOLS)
  const trackRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let offset = 0, raf: number, dead = false

    const tick = () => {
      if (dead) return
      offset += 0.5
      const total = track.scrollWidth / 2
      if (offset >= total) offset = 0
      track.style.transform = `translateX(${-offset}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [])

  const items = [...SYMBOLS, ...SYMBOLS] // duplicate for seamless loop

  return (
    <div style={{ overflow:'hidden', borderBottom:'1px solid var(--border)', background:'var(--bg2)', padding:'6px 0' }}>
      <div ref={trackRef} style={{ display:'flex', gap:0, width:'max-content' }}>
        {items.map((sym, i) => {
          const t      = tickers[sym]
          const label  = sym.replace('_usdt','').toUpperCase()
          const price  = t?.price ?? 0
          const change = t?.changePct ?? 0
          const up     = change >= 0
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 16px', borderRight:'1px solid var(--border)', whiteSpace:'nowrap', fontFamily:"'DM Mono','Space Mono',monospace" }}>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--text2)' }}>{label}</span>
              <span style={{ fontSize:9, color:'var(--text)' }}>
                {price > 0 ? `$${price.toLocaleString('en',{maximumFractionDigits: price < 1 ? 6 : 2})}` : '—'}
              </span>
              <span style={{ fontSize:8, color: up?'var(--green)':'var(--red)', fontWeight:600 }}>
                {change !== 0 ? `${up?'+':''}${change.toFixed(2)}%` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
