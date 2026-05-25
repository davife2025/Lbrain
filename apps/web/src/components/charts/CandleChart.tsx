'use client'

/**
 * apps/web/src/components/charts/CandleChart.tsx
 * Simple SVG candlestick chart — no external deps required
 */

interface Candle {
  time:   number
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
}

interface Props {
  candles:  Candle[]
  width?:   number
  height?:  number
  symbol?:  string
}

export default function CandleChart({ candles, width = 340, height = 160, symbol }: Props) {
  if (!candles.length) return null

  const PADDING = { top: 10, right: 8, bottom: 28, left: 48 }
  const chartW  = width  - PADDING.left - PADDING.right
  const chartH  = height - PADDING.top  - PADDING.bottom

  const prices  = candles.flatMap(c => [c.high, c.low])
  const minP    = Math.min(...prices)
  const maxP    = Math.max(...prices)
  const range   = maxP - minP || 1

  const volumes = candles.map(c => c.volume)
  const maxVol  = Math.max(...volumes) || 1

  const candleW = Math.max(2, (chartW / candles.length) - 1)
  const gap     = chartW / candles.length

  const toY  = (price:  number) => PADDING.top + ((maxP - price) / range) * chartH
  const toVH = (volume: number) => (volume / maxVol) * 20

  const lastCandle  = candles[candles.length - 1]
  const firstCandle = candles[0]
  const overallUp   = lastCandle.close >= firstCandle.open

  // Y-axis labels
  const yLabels = 4
  const yStep   = range / yLabels
  const fmt     = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toFixed(n < 1 ? 4 : 2)

  return (
    <svg width={width} height={height} style={{ overflow:'visible' }}>
      {/* Grid lines */}
      {Array.from({ length: yLabels + 1 }, (_, i) => {
        const price = minP + i * yStep
        const y     = toY(price)
        return (
          <g key={i}>
            <line x1={PADDING.left} y1={y} x2={PADDING.left + chartW} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={PADDING.left - 4} y={y + 3} textAnchor="end" fill="var(--text3)" fontSize={8}>
              ${fmt(price)}
            </text>
          </g>
        )
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const x    = PADDING.left + i * gap + gap / 2
        const up   = c.close >= c.open
        const color = up ? 'var(--green)' : 'var(--red)'
        const bodyTop    = toY(Math.max(c.open, c.close))
        const bodyBottom = toY(Math.min(c.open, c.close))
        const bodyH      = Math.max(1, bodyBottom - bodyTop)

        return (
          <g key={i}>
            {/* Wick */}
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)}
              stroke={color} strokeWidth={1} opacity={0.7} />
            {/* Body */}
            <rect x={x - candleW/2} y={bodyTop} width={candleW} height={bodyH}
              fill={color} opacity={0.85} rx={1} />
            {/* Volume bar at bottom */}
            <rect x={x - candleW/2} y={height - PADDING.bottom + 4} width={candleW} height={toVH(c.volume)}
              fill={color} opacity={0.3} rx={1} />
          </g>
        )
      })}

      {/* Last price line */}
      {lastCandle && (
        <g>
          <line
            x1={PADDING.left} y1={toY(lastCandle.close)}
            x2={PADDING.left + chartW} y2={toY(lastCandle.close)}
            stroke={overallUp ? 'var(--blue)' : 'var(--red)'}
            strokeWidth={1} strokeDasharray="3,3" opacity={0.6}
          />
          <rect
            x={PADDING.left + chartW} y={toY(lastCandle.close) - 8}
            width={48} height={14} rx={3}
            fill={overallUp ? 'var(--blue)' : 'var(--red)'} opacity={0.9}
          />
          <text
            x={PADDING.left + chartW + 24} y={toY(lastCandle.close) + 3}
            textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">
            ${fmt(lastCandle.close)}
          </text>
        </g>
      )}

      {/* X-axis time labels */}
      {[0, Math.floor(candles.length/2), candles.length-1].map(i => {
        if (!candles[i]) return null
        const x    = PADDING.left + i * gap + gap / 2
        const date = new Date(candles[i].time * 1000)
        const label = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`
        return (
          <text key={i} x={x} y={height - 4} textAnchor="middle" fill="var(--text3)" fontSize={7}>
            {label}
          </text>
        )
      })}
    </svg>
  )
}
