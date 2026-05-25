'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'

const COLORS = ['#1a6fff','#00c087','#f59e0b','#8b5cf6','#f04f5a','#06b6d4','#10b981']

export default function PortfolioTab() {
  const { holdings, addHolding, removeHolding, clearHoldings, apiKey, apiSecret } = useStore()
  const [coin,    setCoin]    = useState('')
  const [qty,     setQty]     = useState('')
  const [avgBuy,  setAvgBuy]  = useState('')
  const [adding,  setAdding]  = useState(false)
  const [liveData, setLiveData] = useState<Record<string,number>>({})
  const [loading,  setLoading]  = useState(false)

  const totalCost  = holdings.reduce((s, h) => s + h.qty * h.avgBuy, 0)
  const totalValue = holdings.reduce((s, h) => s + h.qty * (liveData[h.coin] ?? h.avgBuy), 0)
  const totalPnL   = totalValue - totalCost
  const pnlPct     = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  async function fetchLivePrices() {
    setLoading(true)
    const prices: Record<string, number> = {}
    await Promise.allSettled(
      holdings.map(async h => {
        try {
          const res  = await fetch(`/api/lbank/market?skill=ticker&symbol=${h.coin.toLowerCase()}_usdt`)
          const json = await res.json()
          if (json.success) prices[h.coin] = json.data.price
        } catch {}
      })
    )
    setLiveData(prices)
    setLoading(false)
  }

  function handleAdd() {
    if (!coin || !qty || !avgBuy) return
    addHolding({ coin: coin.toUpperCase(), qty: parseFloat(qty), avgBuy: parseFloat(avgBuy), color: COLORS[holdings.length % COLORS.length] })
    setCoin(''); setQty(''); setAvgBuy(''); setAdding(false)
  }

  const fmt  = (n: number) => `$${n.toLocaleString('en', { maximumFractionDigits: 2 })}`
  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, outline:'none', width:'100%' }

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:600, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Portfolio</div>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Manual tracker</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={fetchLivePrices} disabled={loading || holdings.length === 0}
            style={{ padding:'6px 12px', borderRadius:8, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:10, cursor:'pointer', opacity: holdings.length===0 ? 0.5 : 1 }}>
            {loading ? '...' : '↻ Live'}
          </button>
          <button onClick={() => setAdding(v => !v)}
            style={{ padding:'6px 12px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:10, cursor:'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Summary */}
      {holdings.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
          {[
            { label:'Total Value',  value: fmt(totalValue),  color:'var(--text)'  },
            { label:'Total Cost',   value: fmt(totalCost),   color:'var(--text2)' },
            { label:'PnL',          value: `${totalPnL>=0?'+':''}${fmt(totalPnL)} (${pnlPct.toFixed(1)}%)`, color: totalPnL>=0?'var(--green)':'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px' }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Add Holding</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>COIN</div>
              <input value={coin} onChange={e => setCoin(e.target.value)} placeholder="BTC" style={inp}
                onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>QUANTITY</div>
              <input value={qty} onChange={e => setQty(e.target.value)} placeholder="0.5" type="number" style={inp}
                onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>AVG BUY $</div>
              <input value={avgBuy} onChange={e => setAvgBuy(e.target.value)} placeholder="50000" type="number" style={inp}
                onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAdd} style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>Add Holding</button>
            <button onClick={() => setAdding(false)} style={{ padding:'8px 16px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Holdings list */}
      {holdings.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>◑</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No holdings yet</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Add your coins to track your portfolio</div>
          <button onClick={() => setAdding(true)} style={{ padding:'8px 20px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>+ Add Holding</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {holdings.map(h => {
            const live    = liveData[h.coin] ?? h.avgBuy
            const value   = h.qty * live
            const cost    = h.qty * h.avgBuy
            const pnl     = value - cost
            const pnlPct  = ((pnl / cost) * 100)
            return (
              <div key={h.coin} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background: h.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                      {h.coin.slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{h.coin}</div>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>{h.qty} coins · avg {fmt(h.avgBuy)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{fmt(value)}</div>
                    <div style={{ fontSize:10, fontWeight:600, color: pnl>=0 ? 'var(--green)' : 'var(--red)' }}>
                      {pnl>=0?'+':''}{fmt(pnl)} ({pnlPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1, height:3, background:'var(--bg3)', borderRadius:2, marginRight:8 }}>
                    <div style={{ height:3, borderRadius:2, background: h.color, width:`${Math.min(100, Math.abs(pnlPct))}%` }} />
                  </div>
                  <button onClick={() => removeHolding(h.coin)}
                    style={{ fontSize:9, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', padding:'2px 6px' }}>
                    remove
                  </button>
                </div>
              </div>
            )
          })}
          <button onClick={clearHoldings} style={{ padding:'8px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text3)', fontSize:10, cursor:'pointer', marginTop:4 }}>
            Clear all holdings
          </button>
        </div>
      )}
    </div>
  )
}
