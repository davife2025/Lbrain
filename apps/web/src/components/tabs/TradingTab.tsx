'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useSingleTicker } from '@/hooks/useLBankTicker'
import { useLBankOrderBook } from '@/hooks/useLBankOrderBook'
import LivePriceTicker from '@/components/charts/LivePriceTicker'
import OrderBookChart from '@/components/charts/OrderBookChart'
import CandleChart from '@/components/charts/CandleChart'

type Side      = 'buy' | 'sell'
type OrderType = 'limit' | 'market'

const QUICK_PAIRS = ['btc_usdt','eth_usdt','ltc_usdt','xrp_usdt','bnb_usdt','sol_usdt']

export default function TradingTab() {
  const { apiKey, apiSecret, isConnected } = useStore()
  const [symbol,     setSymbol]     = useState('btc_usdt')
  const [side,       setSide]       = useState<Side>('buy')
  const [orderType,  setOrderType]  = useState<OrderType>('limit')
  const [amount,     setAmount]     = useState('')
  const [price,      setPrice]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<{ success: boolean; message: string } | null>(null)
  const [candles,    setCandles]    = useState<any[]>([])
  const [interval,   setInterval]   = useState('hour1')
  const [openOrders, setOpenOrders] = useState<any[]>([])
  const [showOrders, setShowOrders] = useState(false)

  const { ticker, status: wsStatus } = useSingleTicker(symbol)
  const { book }                     = useLBankOrderBook(symbol)

  useEffect(() => { fetchCandles() }, [symbol, interval])
  useEffect(() => {
    if (ticker?.price && orderType === 'limit' && !price) setPrice(ticker.price.toString())
  }, [ticker?.price])
  useEffect(() => {
    if (isConnected && showOrders) fetchOpenOrders()
  }, [showOrders, symbol])

  async function fetchCandles() {
    try {
      const res  = await fetch(`/api/lbank/market?skill=klines&symbol=${symbol}&interval=${interval}&size=50`)
      const json = await res.json()
      if (json.success) setCandles(json.data)
    } catch {}
  }

  async function fetchOpenOrders() {
    try {
      const res = await fetch('/api/lbank/trading', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key': apiKey, 'x-lbank-secret': apiSecret },
        body:    JSON.stringify({ action: 'open_orders', symbol }),
      })
      const json = await res.json()
      if (json.success) setOpenOrders(json.data)
    } catch {}
  }

  async function cancelOrder(orderId: string) {
    try {
      await fetch('/api/lbank/trading', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key': apiKey, 'x-lbank-secret': apiSecret },
        body:    JSON.stringify({ action: 'cancel_order', symbol, orderId }),
      })
      fetchOpenOrders()
    } catch {}
  }

  async function placeOrder() {
    if (!isConnected || !amount) return
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/lbank/trading', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key': apiKey, 'x-lbank-secret': apiSecret },
        body: JSON.stringify({
          action: 'place_order', symbol, side, type: orderType,
          amount: parseFloat(amount),
          ...(orderType === 'limit' && price ? { price: parseFloat(price) } : {}),
        }),
      })
      const json = await res.json()
      setResult(json.data ?? { success: false, message: json.error })
      if (json.data?.success && showOrders) fetchOpenOrders()
    } catch (err: any) {
      setResult({ success: false, message: err.message })
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
    borderRadius:8, padding:'9px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit',
  }

  const INTERVALS = [
    { id:'minute5',  label:'5m'  },
    { id:'minute15', label:'15m' },
    { id:'hour1',    label:'1H'  },
    { id:'hour4',    label:'4H'  },
    { id:'day1',     label:'1D'  },
  ]

  const total = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(4) : '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:"'DM Mono','Space Mono',monospace", overflowY:'auto' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>Trade</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background: wsStatus==='connected'?'var(--green)':'var(--text3)', animation: wsStatus==='connected'?'lbPulse 2s infinite':'none' }} />
              <span style={{ fontSize:9, color: wsStatus==='connected'?'var(--green)':'var(--text3)' }}>
                {wsStatus==='connected' ? 'Live' : wsStatus}
              </span>
            </div>
          </div>
          {ticker && <LivePriceTicker ticker={ticker} />}
        </div>
        <div style={{ display:'flex', gap:5, overflowX:'auto' }}>
          {QUICK_PAIRS.map(p => (
            <button key={p} onClick={() => { setSymbol(p); setPrice('') }}
              style={{ padding:'4px 10px', borderRadius:6, fontSize:9, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background: symbol===p?'var(--blue)':'var(--bg3)', color: symbol===p?'#fff':'var(--text2)', border: symbol===p?'none':'1px solid var(--border)' }}>
              {p.replace('_usdt','').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:4, marginBottom:8 }}>
          {INTERVALS.map(iv => (
            <button key={iv.id} onClick={() => setInterval(iv.id)}
              style={{ padding:'3px 8px', borderRadius:5, fontSize:9, cursor:'pointer', background: interval===iv.id?'var(--blue)':'var(--bg3)', color: interval===iv.id?'#fff':'var(--text3)', border: interval===iv.id?'none':'1px solid var(--border)' }}>
              {iv.label}
            </button>
          ))}
        </div>
        {candles.length > 0 && <div style={{ overflowX:'auto' }}><CandleChart candles={candles} width={340} height={140} /></div>}
      </div>

      {/* Order book */}
      {book && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', marginBottom:8 }}>Order Book</div>
          <OrderBookChart book={book} height={80} />
        </div>
      )}

      {/* Form */}
      <div style={{ padding:'16px', flexShrink:0 }}>
        {!isConnected && (
          <div style={{ background:'rgba(26,111,255,0.06)', border:'1px solid rgba(26,111,255,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:11, color:'var(--blue)' }}>
            ⚠ Connect your LBank API key in Settings to trade
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          {(['buy','sell'] as Side[]).map(s => (
            <button key={s} onClick={() => setSide(s)}
              style={{ padding:'10px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase', background: side===s?(s==='buy'?'var(--green)':'var(--red)'):'var(--bg2)', color: side===s?'#fff':'var(--text2)', border: side===s?'none':'1px solid var(--border)' }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {(['limit','market'] as OrderType[]).map(t => (
            <button key={t} onClick={() => setOrderType(t)}
              style={{ padding:'5px 14px', borderRadius:6, fontSize:10, cursor:'pointer', background: orderType===t?'rgba(26,111,255,0.15)':'transparent', color: orderType===t?'var(--blue)':'var(--text3)', border: orderType===t?'1px solid rgba(26,111,255,0.3)':'1px solid var(--border)' }}>
              {t}
            </button>
          ))}
        </div>

        {orderType === 'limit' && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Price (USDT)</div>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" type="number" style={inp}
              onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Amount</div>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" type="number" style={inp}
            onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
        </div>

        {orderType === 'limit' && amount && price && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, marginBottom:12 }}>
            <span style={{ fontSize:10, color:'var(--text3)' }}>Total</span>
            <span style={{ fontSize:10, fontWeight:600, color:'var(--text)' }}>{total} USDT</span>
          </div>
        )}

        {result && (
          <div style={{ padding:'9px 12px', borderRadius:8, marginBottom:12, background: result.success?'rgba(0,192,135,0.08)':'rgba(240,79,90,0.08)', border:`1px solid ${result.success?'rgba(0,192,135,0.25)':'rgba(240,79,90,0.25)'}`, color: result.success?'var(--green)':'var(--red)', fontSize:11 }}>
            {result.message}
          </div>
        )}

        <button onClick={placeOrder} disabled={loading||!isConnected||!amount}
          style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:13, fontWeight:700, cursor: loading||!isConnected||!amount?'not-allowed':'pointer', background: !isConnected||!amount?'var(--bg3)':side==='buy'?'var(--green)':'var(--red)', color: !isConnected||!amount?'var(--text3)':'#fff', border:'none', opacity: loading?0.7:1, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
          {loading ? 'Placing...' : `${side.toUpperCase()} ${symbol.replace('_usdt','').toUpperCase()}`}
        </button>

        {isConnected && (
          <button onClick={() => setShowOrders(v => !v)} style={{ width:'100%', padding:'8px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text3)', fontSize:10, cursor:'pointer', marginBottom: showOrders?10:0 }}>
            {showOrders?'Hide':'Show'} Open Orders {openOrders.length>0?`(${openOrders.length})`:''}
          </button>
        )}

        {showOrders && openOrders.map(o => (
          <div key={o.orderId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', marginBottom:6 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color: o.side==='buy'?'var(--green)':'var(--red)', textTransform:'uppercase' }}>{o.side} {o.symbol?.replace('_usdt','').toUpperCase()}</div>
              <div style={{ fontSize:9, color:'var(--text3)' }}>{o.amount} @ ${parseFloat(o.price||0).toLocaleString()}</div>
            </div>
            <button onClick={() => cancelOrder(o.orderId)} style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background:'rgba(240,79,90,0.1)', color:'var(--red)', border:'1px solid rgba(240,79,90,0.2)', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        ))}

        <div style={{ fontSize:9, color:'var(--text3)', textAlign:'center', marginTop:12 }}>
          ⚠ Trading carries risk — only trade what you can afford to lose
        </div>
      </div>
      <style>{`@keyframes lbPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
