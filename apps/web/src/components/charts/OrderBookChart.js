'use client';
/**
 * apps/web/src/components/charts/OrderBookChart.tsx
 * Visual order book depth chart — bids (blue) vs asks (red)
 */
import { useMemo } from 'react';
export default function OrderBookChart({ book, height = 120 }) {
    const maxTotal = useMemo(() => {
        const bidMax = book.bids[book.bids.length - 1]?.total ?? 0;
        const askMax = book.asks[book.asks.length - 1]?.total ?? 0;
        return Math.max(bidMax, askMax);
    }, [book]);
    const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(2);
    return (<div style={{ width: '100%', fontFamily: "'DM Mono','Space Mono',monospace" }}>
      {/* Mid price + spread */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: 'var(--text3)' }}>Spread: ${book.spread.toFixed(4)}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>${book.midPrice.toLocaleString('en', { maximumFractionDigits: 2 })}</span>
        <span style={{ fontSize: 9, color: 'var(--text3)' }}>Mid price</span>
      </div>

      {/* Depth bars */}
      <div style={{ position: 'relative', height, overflow: 'hidden', borderRadius: 6, background: 'var(--bg3)' }}>
        {/* Bid bars (left → right, blue) */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', display: 'flex', alignItems: 'flex-end', gap: 1, padding: '0 2px', flexDirection: 'row-reverse' }}>
          {book.bids.slice(0, 15).map((b, i) => (<div key={i} style={{ flex: 1, height: `${(b.total / maxTotal) * 100}%`, background: 'rgba(26,111,255,0.5)', borderRadius: '2px 2px 0 0', minWidth: 4 }}/>))}
        </div>

        {/* Ask bars (left → right, red) */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', display: 'flex', alignItems: 'flex-end', gap: 1, padding: '0 2px' }}>
          {book.asks.slice(0, 15).map((a, i) => (<div key={i} style={{ flex: 1, height: `${(a.total / maxTotal) * 100}%`, background: 'rgba(240,79,90,0.5)', borderRadius: '2px 2px 0 0', minWidth: 4 }}/>))}
        </div>

        {/* Center line */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)', transform: 'translateX(-50%)' }}/>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 8, color: 'var(--blue)' }}>Bids (buy)</span>
        <span style={{ fontSize: 8, color: 'var(--red)' }}>Asks (sell)</span>
      </div>

      {/* Top 5 bids and asks table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
        {/* Bids */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 8, color: 'var(--text3)', marginBottom: 4, padding: '0 2px' }}>
            <span>Price</span><span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          {book.bids.slice(0, 5).map((b, i) => (<div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 9, padding: '2px', borderRadius: 3, marginBottom: 1, background: `rgba(26,111,255,${0.04 + (0.04 * (5 - i))})` }}>
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>${b.price.toLocaleString('en', { maximumFractionDigits: 4 })}</span>
              <span style={{ textAlign: 'right', color: 'var(--text2)' }}>{fmt(b.amount)}</span>
            </div>))}
        </div>

        {/* Asks */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 8, color: 'var(--text3)', marginBottom: 4, padding: '0 2px' }}>
            <span>Price</span><span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          {book.asks.slice(0, 5).map((a, i) => (<div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 9, padding: '2px', borderRadius: 3, marginBottom: 1, background: `rgba(240,79,90,${0.04 + (0.04 * (5 - i))})` }}>
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>${a.price.toLocaleString('en', { maximumFractionDigits: 4 })}</span>
              <span style={{ textAlign: 'right', color: 'var(--text2)' }}>{fmt(a.amount)}</span>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=OrderBookChart.js.map