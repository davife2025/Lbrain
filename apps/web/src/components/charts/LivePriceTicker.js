'use client';
/**
 * apps/web/src/components/charts/LivePriceTicker.tsx
 * Animated live price display with direction flash
 */
import { useEffect, useRef, useState } from 'react';
export default function LivePriceTicker({ ticker, large = false }) {
    const [flash, setFlash] = useState(null);
    const prevRef = useRef(null);
    useEffect(() => {
        if (!ticker)
            return;
        const prev = prevRef.current;
        if (prev !== null && prev !== ticker.price) {
            setFlash(ticker.price > prev ? 'up' : 'down');
            const t = setTimeout(() => setFlash(null), 600);
            return () => clearTimeout(t);
        }
        prevRef.current = ticker.price;
    }, [ticker?.price]);
    if (!ticker) {
        return (<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
      </div>);
    }
    const flashColor = flash === 'up' ? 'rgba(0,192,135,0.15)' : flash === 'down' ? 'rgba(240,79,90,0.15)' : 'transparent';
    const changeColor = ticker.changePct >= 0 ? 'var(--green)' : 'var(--red)';
    return (<div style={{ display: 'inline-flex', alignItems: 'baseline', gap: large ? 12 : 6, padding: '4px 8px', borderRadius: 8, background: flashColor, transition: 'background 0.3s', fontFamily: "'DM Mono','Space Mono',monospace" }}>
      <span style={{ fontSize: large ? 28 : 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
        ${ticker.price.toLocaleString('en', { maximumFractionDigits: ticker.price < 1 ? 6 : 2 })}
      </span>
      <span style={{ fontSize: large ? 13 : 10, fontWeight: 600, color: changeColor }}>
        {ticker.changePct >= 0 ? '▲' : '▼'} {Math.abs(ticker.changePct).toFixed(2)}%
      </span>
    </div>);
}
//# sourceMappingURL=LivePriceTicker.js.map