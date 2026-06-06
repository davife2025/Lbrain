'use client';
import { useEffect, useRef, useState } from 'react';
const PAD = { top: 12, right: 68, bottom: 52, left: 8 };
const VOL_H = 30;
export default function CandleChart({ candles, height = 240, symbol }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const [hover, setHover] = useState(null);
    const [crossX, setCrossX] = useState(0);
    const [showCross, setShowCross] = useState(false);
    // Redraw whenever candles change or on resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap || !candles.length)
            return;
        // Force canvas to match wrapper width
        const W = wrap.clientWidth;
        const H = height;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        draw(canvas, W, H, dpr);
    }, [candles, height, hover, showCross, crossX]);
    // Resize observer
    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap)
            return;
        const ro = new ResizeObserver(() => {
            const canvas = canvasRef.current;
            if (!canvas || !candles.length)
                return;
            const W = wrap.clientWidth;
            const H = height;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            draw(canvas, W, H, dpr);
        });
        ro.observe(wrap);
        return () => ro.disconnect();
    }, [candles, height]);
    function draw(canvas, W, H, dpr) {
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, W, H);
        const chartW = W - PAD.left - PAD.right;
        const chartH = H - PAD.top - PAD.bottom - VOL_H - 8;
        const volTop = PAD.top + chartH + 8;
        // Price range with padding
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const minP = Math.min(...lows);
        const maxP = Math.max(...highs);
        const rng = maxP - minP || 1;
        const pad = rng * 0.06;
        const lo = minP - pad;
        const hi = maxP + pad;
        const priceH = hi - lo;
        const maxVol = Math.max(...candles.map(c => c.volume)) || 1;
        const toY = (p) => PAD.top + ((hi - p) / priceH) * chartH;
        const colW = Math.max(1, (chartW / candles.length) - 1);
        const cx = (i) => PAD.left + (i + 0.5) * (chartW / candles.length);
        // Horizontal grid
        const gridN = 4;
        for (let i = 0; i <= gridN; i++) {
            const y = PAD.top + (i / gridN) * chartH;
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(PAD.left, y);
            ctx.lineTo(PAD.left + chartW, y);
            ctx.stroke();
            // Price labels
            const price = hi - (i / gridN) * priceH;
            const label = price >= 1000
                ? `$${price.toLocaleString('en', { maximumFractionDigits: 0 })}`
                : price >= 1
                    ? `$${price.toFixed(2)}`
                    : `$${price.toFixed(5)}`;
            ctx.fillStyle = 'rgba(100,110,130,0.8)';
            ctx.font = `10px "DM Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, PAD.left + chartW + 4, y);
        }
        // Volume bars
        candles.forEach((c, i) => {
            const up = c.close >= c.open;
            const vh = (c.volume / maxVol) * VOL_H;
            ctx.fillStyle = up ? 'rgba(0,192,135,0.2)' : 'rgba(240,79,90,0.2)';
            ctx.fillRect(cx(i) - colW / 2, volTop + VOL_H - vh, colW, vh);
        });
        // VOL label
        ctx.fillStyle = 'rgba(100,110,130,0.5)';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('VOL', PAD.left + chartW + 4, volTop);
        // Candles
        candles.forEach((c, i) => {
            const up = c.close >= c.open;
            const color = up ? '#00c087' : '#f04f5a';
            const x = cx(i);
            const bodyT = toY(Math.max(c.open, c.close));
            const bodyB = toY(Math.min(c.open, c.close));
            const bodyH = Math.max(1, bodyB - bodyT);
            // Wick
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.moveTo(x, toY(c.high));
            ctx.lineTo(x, toY(c.low));
            ctx.stroke();
            // Body
            ctx.globalAlpha = up ? 0.85 : 0.9;
            ctx.fillStyle = color;
            ctx.fillRect(x - colW / 2, bodyT, colW, bodyH);
            ctx.globalAlpha = 1;
        });
        // Last price dashed line + tag
        const last = candles[candles.length - 1];
        const lastY = toY(last.close);
        const up = last.close >= last.open;
        const lc = up ? '#00c087' : '#f04f5a';
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = lc;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(PAD.left, lastY);
        ctx.lineTo(PAD.left + chartW, lastY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        const tagLabel = last.close >= 1000
            ? `$${last.close.toLocaleString('en', { maximumFractionDigits: 0 })}`
            : `$${last.close.toFixed(last.close < 1 ? 4 : 2)}`;
        const tagW = 60, tagH = 15;
        ctx.fillStyle = lc;
        ctx.beginPath();
        ctx.roundRect?.(PAD.left + chartW + 4, lastY - tagH / 2, tagW, tagH, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagLabel, PAD.left + chartW + 4 + tagW / 2, lastY);
        // Hover crosshair
        if (showCross && hover) {
            const hi2 = candles.findIndex(c => c.time === hover.time);
            if (hi2 >= 0) {
                ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(cx(hi2), PAD.top);
                ctx.lineTo(cx(hi2), PAD.top + chartH);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        // Time axis
        const step = Math.max(1, Math.floor(candles.length / 6));
        ctx.fillStyle = 'rgba(100,110,130,0.6)';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < candles.length; i += step) {
            const d = new Date(candles[i].time * 1000);
            const label = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}h`;
            ctx.fillText(label, cx(i), PAD.top + chartH + VOL_H + 10);
        }
    }
    function onMouseMove(e) {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap || !candles.length)
            return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const W = wrap.clientWidth;
        const chartW = W - PAD.left - PAD.right;
        const idx = Math.round(((mx - PAD.left) / chartW) * (candles.length - 1));
        const c = candles[Math.max(0, Math.min(candles.length - 1, idx))];
        setHover(c);
        setCrossX(mx);
        setShowCross(true);
    }
    const fmtP = (n) => n >= 1000
        ? `$${n.toLocaleString('en', { maximumFractionDigits: 0 })}`
        : `$${n.toFixed(n < 1 ? 5 : 2)}`;
    const fmtV = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0);
    return (<div ref={wrapRef} style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {/* OHLCV tooltip */}
      {showCross && hover && (<div style={{ position: 'absolute', top: 4, left: PAD.left + 4, zIndex: 10, display: 'flex', gap: 8, alignItems: 'center', fontFamily: '"DM Mono",monospace', fontSize: 9, background: 'rgba(9,9,15,0.9)', padding: '4px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#555' }}>O</span><span style={{ color: '#aaa' }}>{fmtP(hover.open)}</span>
          <span style={{ color: '#555' }}>H</span><span style={{ color: '#00c087' }}>{fmtP(hover.high)}</span>
          <span style={{ color: '#555' }}>L</span><span style={{ color: '#f04f5a' }}>{fmtP(hover.low)}</span>
          <span style={{ color: '#555' }}>C</span><span style={{ color: hover.close >= hover.open ? '#00c087' : '#f04f5a' }}>{fmtP(hover.close)}</span>
          <span style={{ color: '#555' }}>V</span><span style={{ color: '#888' }}>{fmtV(hover.volume)}</span>
        </div>)}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height, cursor: 'crosshair' }} onMouseMove={onMouseMove} onMouseLeave={() => { setShowCross(false); setHover(null); }}/>
    </div>);
}
//# sourceMappingURL=CandleChart.js.map