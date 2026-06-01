'use client'

/**
 * apps/web/src/components/charts/CandleChart.tsx
 * Full professional crypto candlestick chart.
 * Features: OHLCV candles, price axis, time axis, volume bars, last price line, hover crosshair.
 */

import { useRef, useEffect, useState } from 'react'

export interface Candle {
  time:   number
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
}

interface Props {
  candles:  Candle[]
  symbol?:  string
  height?:  number
}

const PAD = { top: 12, right: 64, bottom: 48, left: 8 }
const VOL_H = 32  // volume panel height

export default function CandleChart({ candles, symbol, height = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover,   setHover]   = useState<Candle | null>(null)
  const [mouseX,  setMouseX]  = useState(0)
  const [mouseY,  setMouseY]  = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    draw()
  }, [candles, hover])

  function draw() {
    const canvas = canvasRef.current
    if (!canvas || !candles.length) return
    const ctx   = canvas.getContext('2d')!
    const dpr   = window.devicePixelRatio || 1
    const W     = canvas.offsetWidth
    const H     = height

    canvas.width  = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const chartW  = W   - PAD.left - PAD.right
    const chartH  = H   - PAD.top  - PAD.bottom - VOL_H - 6
    const volTop  = PAD.top + chartH + 6

    // Price range
    const highs  = candles.map(c => c.high)
    const lows   = candles.map(c => c.low)
    const minP   = Math.min(...lows)
    const maxP   = Math.max(...highs)
    const range  = maxP - minP || 1
    const pad    = range * 0.05
    const lo     = minP - pad
    const hi     = maxP + pad
    const priceH = hi - lo

    const maxVol = Math.max(...candles.map(c => c.volume)) || 1

    const toY   = (p: number)  => PAD.top + ((hi - p) / priceH) * chartH
    const toVY  = (v: number)  => volTop + VOL_H - (v / maxVol) * VOL_H
    const toVH2 = (v: number)  => (v / maxVol) * VOL_H
    const candleW = Math.max(1.5, (chartW / candles.length) - 1.5)
    const x       = (i: number) => PAD.left + (i + 0.5) * (chartW / candles.length)

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, W, H)

    // Grid lines (horizontal)
    const gridCount = 5
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth   = 1
    for (let i = 0; i <= gridCount; i++) {
      const y = PAD.top + (i / gridCount) * chartH
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(PAD.left + chartW, y)
      ctx.stroke()
    }

    // Price axis labels
    ctx.fillStyle    = 'rgba(107,114,128,0.8)'
    ctx.font         = `10px 'DM Mono', monospace`
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= gridCount; i++) {
      const price = hi - (i / gridCount) * priceH
      const y     = PAD.top + (i / gridCount) * chartH
      const label = price >= 1000
        ? `$${(price/1000).toFixed(1)}k`
        : price >= 1
        ? `$${price.toFixed(2)}`
        : `$${price.toFixed(6)}`
      ctx.fillText(label, PAD.left + chartW + 6, y)
    }

    // Volume bars
    candles.forEach((c, i) => {
      const up    = c.close >= c.open
      const cx    = x(i)
      const vh    = toVH2(c.volume)
      const vy    = toVY(c.volume)
      ctx.fillStyle = up ? 'rgba(0,192,135,0.25)' : 'rgba(240,79,90,0.25)'
      ctx.fillRect(cx - candleW/2, vy, candleW, vh)
    })

    // Volume axis label
    ctx.fillStyle    = 'rgba(107,114,128,0.5)'
    ctx.font         = `9px 'DM Mono', monospace`
    ctx.textBaseline = 'top'
    ctx.fillText('VOL', PAD.left + chartW + 6, volTop)

    // Candles
    candles.forEach((c, i) => {
      const up    = c.close >= c.open
      const cx    = x(i)
      const color = up ? '#00c087' : '#f04f5a'
      const bodyTop    = toY(Math.max(c.open, c.close))
      const bodyBottom = toY(Math.min(c.open, c.close))
      const bodyH      = Math.max(1, bodyBottom - bodyTop)

      // Wick
      ctx.strokeStyle = color
      ctx.lineWidth   = 1
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.moveTo(cx, toY(c.high))
      ctx.lineTo(cx, toY(c.low))
      ctx.stroke()

      // Body
      ctx.globalAlpha = 0.9
      if (up) {
        ctx.fillStyle = color
        ctx.fillRect(cx - candleW/2, bodyTop, candleW, bodyH)
      } else {
        ctx.fillStyle = color
        ctx.fillRect(cx - candleW/2, bodyTop, candleW, bodyH)
      }
      ctx.globalAlpha = 1
    })

    // Last price dashed line
    const last = candles[candles.length - 1]
    if (last) {
      const lastY   = toY(last.close)
      const up      = last.close >= last.open
      const lColor  = up ? '#00c087' : '#f04f5a'

      ctx.setLineDash([3, 4])
      ctx.strokeStyle = lColor
      ctx.lineWidth   = 0.8
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(PAD.left, lastY)
      ctx.lineTo(PAD.left + chartW, lastY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // Last price tag
      const label  = last.close >= 1000
        ? `$${(last.close/1000).toFixed(2)}k`
        : `$${last.close.toFixed(last.close < 1 ? 4 : 2)}`
      const tagW   = 54
      const tagH   = 14
      ctx.fillStyle    = lColor
      ctx.beginPath()
      ctx.roundRect(PAD.left + chartW + 4, lastY - tagH/2, tagW, tagH, 3)
      ctx.fill()
      ctx.fillStyle    = '#fff'
      ctx.font         = `bold 9px 'DM Mono', monospace`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, PAD.left + chartW + 4 + tagW/2, lastY)
    }

    // Hover crosshair
    if (visible && hover) {
      const hi2 = candles.indexOf(hover)
      if (hi2 >= 0) {
        const cx  = x(hi2)
        const hy  = toY(hover.close)

        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth   = 1
        ctx.setLineDash([2, 3])

        // Vertical line
        ctx.beginPath()
        ctx.moveTo(cx, PAD.top)
        ctx.lineTo(cx, PAD.top + chartH)
        ctx.stroke()

        // Horizontal line
        ctx.beginPath()
        ctx.moveTo(PAD.left, hy)
        ctx.lineTo(PAD.left + chartW, hy)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Time axis
    const step = Math.max(1, Math.floor(candles.length / 5))
    ctx.fillStyle    = 'rgba(107,114,128,0.6)'
    ctx.font         = `9px 'DM Mono', monospace`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i < candles.length; i += step) {
      const d     = new Date(candles[i].time * 1000)
      const label = `${(d.getMonth()+1)}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}h`
      ctx.fillText(label, x(i), PAD.top + chartH + VOL_H + 10)
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas || !candles.length) return
    const rect   = canvas.getBoundingClientRect()
    const mx     = e.clientX - rect.left
    const my     = e.clientY - rect.top
    const W      = canvas.offsetWidth
    const chartW = W - PAD.left - PAD.right
    const idx    = Math.round(((mx - PAD.left) / chartW) * (candles.length - 1))
    const clamped = Math.max(0, Math.min(candles.length - 1, idx))
    setHover(candles[clamped])
    setMouseX(mx)
    setMouseY(my)
    setVisible(true)
  }

  const fmt = (n: number) => n >= 1000
    ? `$${n.toLocaleString('en', { maximumFractionDigits:2 })}`
    : `$${n.toFixed(n < 1 ? 6 : 4)}`

  const fmtVol = (n: number) => n >= 1_000_000
    ? `${(n/1_000_000).toFixed(2)}M`
    : n >= 1000
    ? `${(n/1000).toFixed(1)}K`
    : n.toFixed(0)

  return (
    <div style={{ position:'relative', width:'100%', userSelect:'none' }}>
      {/* OHLCV tooltip */}
      {visible && hover && (
        <div style={{
          position:'absolute', top:4, left:PAD.left + 4, zIndex:10,
          display:'flex', gap:10, alignItems:'center',
          fontFamily:'var(--font-mono)', fontSize:9,
          background:'rgba(9,9,15,0.85)', padding:'4px 8px', borderRadius:5,
          border:'1px solid var(--border)', pointerEvents:'none',
        }}>
          <span style={{ color:'var(--text3)' }}>O</span><span style={{ color:'var(--text2)' }}>{fmt(hover.open)}</span>
          <span style={{ color:'var(--text3)' }}>H</span><span style={{ color:'var(--green)' }}>{fmt(hover.high)}</span>
          <span style={{ color:'var(--text3)' }}>L</span><span style={{ color:'var(--red)' }}>{fmt(hover.low)}</span>
          <span style={{ color:'var(--text3)' }}>C</span><span style={{ color: hover.close >= hover.open ? 'var(--green)' : 'var(--red)' }}>{fmt(hover.close)}</span>
          <span style={{ color:'var(--text3)' }}>V</span><span style={{ color:'var(--text2)' }}>{fmtVol(hover.volume)}</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width:'100%', height, display:'block', cursor:'crosshair' }}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setVisible(false); setHover(null) }}
      />
    </div>
  )
}
