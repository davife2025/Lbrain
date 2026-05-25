'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

type Side = 'buy' | 'sell'
type OrderType = 'limit' | 'market'

export default function TradingTab() {
  const { apiKey, apiSecret, isConnected } = useStore()
  const [symbol,    setSymbol]    = useState('btc_usdt')
  const [side,      setSide]      = useState<Side>('buy')
  const [orderType, setOrderType] = useState<OrderType>('limit')
  const [amount,    setAmount]    = useState('')
  const [price,     setPrice]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<{ success: boolean; message: string } | null>(null)
  const [ticker,    setTicker]    = useState<{ price: number; changePct: number } | null>(null)

  useEffect(() => { fetchTicker() }, [symbol])

  async function fetchTicker() {
    try {
      const res  = await fetch(`/api/lbank/market?skill=ticker&symbol=${symbol}`)
      const json = await res.json()
      if (json.success) {
        setTicker({ price: json.data.price, changePct: json.data.changePct })
        if (orderType === 'limit' && !price) setPrice(json.data.price.toString())
      }
    } catch {}
  }

  async function placeOrder() {
    if (!isConnected) return
    if (!amount) return
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/lbank/trading', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key': apiKey, 'x-lbank-secret': apiSecret },
        body: JSON.stringify({
          action: 'place_order',
          symbol, side, type: orderType, amount: parseFloat(amount),
          ...(orderType === 'limit' && price ? { price: parseFloat(price) } : {}),
        }),
      })
      const json = await res.json()
      setResult(json.data ?? { success: false, message: json.error })
    } catch (err: any) {
      setResult({ success: false, message: err.message })
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'10px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit' }
  const total = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '—'

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:480, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Trade</div>
        <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Spot trading on LBank</div>
      </div>

      {!isConnected && (
        <div style={{ background:'rgba(26,111,255,0.06)', border:'1px solid rgba(26,111,255,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:11, color:'var(--blue)' }}>
          ⚠ Connect your LBank API key in Settings to trade
        </div>
      )}

      {/* Symbol + ticker */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>SYMBOL</div>
          {ticker && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>${ticker.price.toLocaleString()}</span>
              <span style={{ fontSize:11, color: ticker.changePct>=0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                {ticker.changePct>=0?'+':''}{ticker.changePct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <input value={symbol} onChange={e => setSymbol(e.target.value.toLowerCase())} placeholder="btc_usdt" style={inp}
          onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
          onBlur={e => { (e.target as HTMLElement).style.borderColor='var(--border)'; fetchTicker() }} />
      </div>

      {/* Side toggle */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {(['buy','sell'] as Side[]).map(s => (
          <button key={s} onClick={() => setSide(s)}
            style={{ padding:'10px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase', background: side===s ? (s==='buy'?'var(--green)':'var(--red)') : 'var(--bg2)', color: side===s ? '#fff' : 'var(--text2)', border: side===s ? 'none' : '1px solid var(--border)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {(['limit','market'] as OrderType[]).map(t => (
          <button key={t} onClick={() => setOrderType(t)}
            style={{ padding:'5px 14px', borderRadius:6, fontSize:10, cursor:'pointer', textTransform:'capitalize', background: orderType===t ? 'rgba(26,111,255,0.15)' : 'transparent', color: orderType===t ? 'var(--blue)' : 'var(--text3)', border: orderType===t ? '1px solid rgba(26,111,255,0.3)' : '1px solid var(--border)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Price (limit only) */}
      {orderType === 'limit' && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Price (USDT)</div>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" type="number" style={inp}
            onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
        </div>
      )}

      {/* Amount */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Amount</div>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" type="number" style={inp}
          onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
          onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
      </div>

      {/* Total */}
      {orderType === 'limit' && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, marginBottom:16 }}>
          <span style={{ fontSize:11, color:'var(--text3)' }}>Total</span>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>${total} USDT</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:12, background: result.success ? 'rgba(0,192,135,0.08)' : 'rgba(240,79,90,0.08)', border: `1px solid ${result.success ? 'rgba(0,192,135,0.25)' : 'rgba(240,79,90,0.25)'}`, color: result.success ? 'var(--green)' : 'var(--red)', fontSize:11 }}>
          {result.message}
        </div>
      )}

      {/* Submit */}
      <button onClick={placeOrder} disabled={loading || !isConnected || !amount}
        style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:13, fontWeight:700, cursor: loading||!isConnected||!amount ? 'not-allowed' : 'pointer', background: !isConnected||!amount ? 'var(--bg3)' : side==='buy' ? 'var(--green)' : 'var(--red)', color: !isConnected||!amount ? 'var(--text3)' : '#fff', border:'none', opacity: loading ? 0.7 : 1, textTransform:'uppercase', letterSpacing:'0.05em' }}>
        {loading ? 'Placing order...' : `${side.toUpperCase()} ${symbol.replace('_usdt','').toUpperCase()}`}
      </button>

      <div style={{ fontSize:9, color:'var(--text3)', textAlign:'center', marginTop:10 }}>
        ⚠ Trading carries risk — only trade what you can afford to lose
      </div>
    </div>
  )
}
