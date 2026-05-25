'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useLBankTicker } from '@/hooks/useLBankTicker'

const COLORS = ['#1a6fff','#00c087','#f59e0b','#8b5cf6','#f04f5a','#06b6d4','#10b981']

export default function PortfolioTab() {
  const { holdings, addHolding, removeHolding, clearHoldings } = useStore()
  const [coin,   setCoin]   = useState('')
  const [qty,    setQty]    = useState('')
  const [avgBuy, setAvgBuy] = useState('')
  const [adding, setAdding] = useState(false)

  const symbols = holdings.map(h => `${h.coin.toLowerCase()}_usdt`)
  const { tickers } = useLBankTicker(symbols)
  const getLive = (coin: string) => tickers[`${coin.toLowerCase()}_usdt`]?.price ?? null

  const totalCost  = holdings.reduce((s, h) => s + h.qty * h.avgBuy, 0)
  const totalValue = holdings.reduce((s, h) => s + h.qty * (getLive(h.coin) ?? h.avgBuy), 0)
  const totalPnL   = totalValue - totalCost
  const pnlPct     = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0
  const fmt        = (n: number) => `$${n.toLocaleString('en', { maximumFractionDigits: 2 })}`

  function handleAdd() {
    if (!coin || !qty || !avgBuy) return
    addHolding({ coin: coin.toUpperCase(), qty: parseFloat(qty), avgBuy: parseFloat(avgBuy), color: COLORS[holdings.length % COLORS.length] })
    setCoin(''); setQty(''); setAvgBuy(''); setAdding(false)
  }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit' }

  // Donut chart
  const donutData = holdings.map(h => ({ coin: h.coin, value: h.qty * (getLive(h.coin) ?? h.avgBuy), color: h.color })).filter(d => d.value > 0)
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1
  let cumAngle = -90
  const R = 44, CX = 60, CY = 60
  const rad = (a: number) => (a * Math.PI) / 180
  const donutPaths = donutData.map(d => {
    const angle = (d.value / donutTotal) * 360
    const start = cumAngle; cumAngle += angle; const end = cumAngle
    const x1 = CX + R * Math.cos(rad(start)); const y1 = CY + R * Math.sin(rad(start))
    const x2 = CX + R * Math.cos(rad(end));   const y2 = CY + R * Math.sin(rad(end))
    return { path:`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${angle>180?1:0} 1 ${x2} ${y2} Z`, color:d.color, coin:d.coin, pct:((d.value/donutTotal)*100).toFixed(1) }
  })

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:560, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Portfolio</div>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{symbols.length > 0 ? '● Live prices' : 'Manual tracker'}</div>
        </div>
        <button onClick={() => setAdding(v => !v)} style={{ padding:'6px 14px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:10, cursor:'pointer', fontWeight:600 }}>+ Add</button>
      </div>

      {holdings.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
          {[['Value',fmt(totalValue),'var(--text)'],['Cost',fmt(totalCost),'var(--text2)'],['PnL',`${totalPnL>=0?'+':''}${fmt(totalPnL)}`,totalPnL>=0?'var(--green)':'var(--red)']].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:12, fontWeight:700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {donutData.length > 1 && (
        <div style={{ display:'flex', alignItems:'center', gap:16, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <svg width={120} height={120} viewBox="0 0 120 120">
            {donutPaths.map((d, i) => <path key={i} d={d.path} fill={d.color} opacity={0.85} />)}
            <circle cx={CX} cy={CY} r={28} fill="var(--bg2)" />
            <text x={CX} y={CY-4} textAnchor="middle" fill="var(--text)" fontSize={9} fontWeight="bold">{fmt(totalValue).replace('$','')}</text>
            <text x={CX} y={CY+8} textAnchor="middle" fill="var(--text3)" fontSize={7}>total</text>
          </svg>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
            {donutPaths.map(d => (
              <div key={d.coin} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }} />
                <span style={{ fontSize:10, color:'var(--text2)', flex:1 }}>{d.coin}</span>
                <span style={{ fontSize:9, color:'var(--text3)' }}>{d.pct}%</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, paddingTop:6, borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:9, color:'var(--text3)' }}>PnL</span>
              <span style={{ fontSize:10, fontWeight:700, color: totalPnL>=0?'var(--green)':'var(--red)' }}>{totalPnL>=0?'+':''}{pnlPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Add Holding</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
            <div><div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>COIN</div><input value={coin} onChange={e=>setCoin(e.target.value)} placeholder="BTC" style={inp} onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'} onBlur={e=>(e.target as HTMLElement).style.borderColor='var(--border)'} /></div>
            <div><div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>QTY</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0.5" style={inp} onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'} onBlur={e=>(e.target as HTMLElement).style.borderColor='var(--border)'} /></div>
            <div><div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>AVG BUY $</div><input type="number" value={avgBuy} onChange={e=>setAvgBuy(e.target.value)} placeholder="50000" style={inp} onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'} onBlur={e=>(e.target as HTMLElement).style.borderColor='var(--border)'} /></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAdd} style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding:'8px 16px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {holdings.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>◑</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No holdings yet</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Add your coins to track portfolio value</div>
          <button onClick={() => setAdding(true)} style={{ padding:'8px 20px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>+ Add Holding</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {holdings.map(h => {
            const live = getLive(h.coin)
            const price = live ?? h.avgBuy
            const value = h.qty * price
            const cost  = h.qty * h.avgBuy
            const pnl   = value - cost
            const pnlP  = cost > 0 ? (pnl/cost)*100 : 0
            return (
              <div key={h.coin} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:h.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{h.coin.slice(0,3)}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{h.coin}</span>
                        {live && <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'lbPulse 2s infinite' }} />}
                      </div>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>{h.qty} × ${price.toLocaleString('en',{maximumFractionDigits:4})}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{fmt(value)}</div>
                    <div style={{ fontSize:10, fontWeight:600, color: pnl>=0?'var(--green)':'var(--red)' }}>{pnl>=0?'+':''}{fmt(pnl)} ({pnlP.toFixed(1)}%)</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, height:3, background:'var(--bg3)', borderRadius:2 }}>
                    <div style={{ height:3, borderRadius:2, background:h.color, width:`${Math.min(100,Math.abs(pnlP))}%`, transition:'width 0.3s' }} />
                  </div>
                  <button onClick={() => removeHolding(h.coin)} style={{ fontSize:9, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', padding:'2px 6px', flexShrink:0 }}>remove</button>
                </div>
              </div>
            )
          })}
          {holdings.length > 1 && <button onClick={clearHoldings} style={{ padding:'8px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text3)', fontSize:10, cursor:'pointer', marginTop:4 }}>Clear all</button>}
        </div>
      )}
      <style>{`@keyframes lbPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
