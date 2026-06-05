'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useSingleTicker } from '@/hooks/useLBankTicker'
import { useLBankOrderBook } from '@/hooks/useLBankOrderBook'
import LivePriceTicker from '@/components/charts/LivePriceTicker'
import OrderBookChart from '@/components/charts/OrderBookChart'
import CandleChart, { type Candle } from '@/components/charts/CandleChart'

type Side      = 'buy' | 'sell'
type OrderType = 'limit' | 'market'
type TabView   = 'chart' | 'order' | 'analyse' | 'orders'

const QUICK_PAIRS  = ['btc_usdt','eth_usdt','ltc_usdt','xrp_usdt','bnb_usdt','sol_usdt']
const INTERVALS    = [{ id:'minute5',label:'5m'},{ id:'minute15',label:'15m'},{ id:'hour1',label:'1H'},{ id:'hour4',label:'4H'},{ id:'day1',label:'1D'}]

// ── Simple technical indicators ───────────────────────────────────────────
function calcSMA(data: number[], period: number): number {
  if (data.length < period) return 0
  return data.slice(-period).reduce((s, v) => s + v, 0) / period
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains  += diff
    else          losses -= diff
  }
  const avgGain = gains  / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function calcMACD(closes: number[]): { macd: number; signal: number; hist: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 }
  const ema12 = calcSMA(closes, 12)
  const ema26 = calcSMA(closes, 26)
  const macd  = ema12 - ema26
  const signal = macd * 0.9
  return { macd, signal, hist: macd - signal }
}

function calcBB(closes: number[], period = 20): { upper: number; middle: number; lower: number } {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 }
  const slice  = closes.slice(-period)
  const mean   = slice.reduce((s, v) => s + v, 0) / period
  const std    = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period)
  return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std }
}

function getSignal(rsi: number, macd: { hist: number }, price: number, bb: { upper: number; lower: number }): {
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL'
  color:  string
  score:  number
  reasons: string[]
} {
  let score   = 0
  const reasons: string[] = []

  if (rsi < 30)       { score += 2; reasons.push('RSI oversold (<30)') }
  else if (rsi < 45)  { score += 1; reasons.push('RSI leaning bullish') }
  else if (rsi > 70)  { score -= 2; reasons.push('RSI overbought (>70)') }
  else if (rsi > 55)  { score -= 1; reasons.push('RSI leaning bearish') }

  if (macd.hist > 0)  { score += 1; reasons.push('MACD histogram positive') }
  else                { score -= 1; reasons.push('MACD histogram negative') }

  if (price < bb.lower)  { score += 1; reasons.push('Price below lower Bollinger Band') }
  else if (price > bb.upper) { score -= 1; reasons.push('Price above upper Bollinger Band') }

  if      (score >= 3)  return { signal:'STRONG BUY',  color:'#00c087', score, reasons }
  else if (score >= 1)  return { signal:'BUY',          color:'#00c087', score, reasons }
  else if (score <= -3) return { signal:'STRONG SELL',  color:'#f04f5a', score, reasons }
  else if (score <= -1) return { signal:'SELL',          color:'#f04f5a', score, reasons }
  else                  return { signal:'NEUTRAL',       color:'#f59e0b', score, reasons }
}

export default function TradingTab() {
  const { apiKey, apiSecret, isConnected } = useStore()
  const [symbol,     setSymbol]     = useState('btc_usdt')
  const [side,       setSide]       = useState<Side>('buy')
  const [orderType,  setOrderType]  = useState<OrderType>('limit')
  const [amount,     setAmount]     = useState('')
  const [price,      setPrice]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<{ success: boolean; message: string } | null>(null)
  const [candles,    setCandles]    = useState<Candle[]>([])
  const [candleLoad, setCandleLoad] = useState(false)
  const [interval,   setInterval]   = useState('hour1')
  const [openOrders, setOpenOrders] = useState<any[]>([])
  const [view,       setView]       = useState<TabView>('chart')

  const { ticker, status } = useSingleTicker(symbol)
  const { book }            = useLBankOrderBook(symbol)

  useEffect(() => { fetchCandles() }, [symbol, interval])
  useEffect(() => {
    if (ticker?.price && orderType === 'limit' && !price) setPrice(ticker.price.toFixed(2))
  }, [ticker?.price])

  async function fetchCandles() {
    setCandleLoad(true)
    try {
      const res  = await fetch(`/api/lbank/market?skill=klines&symbol=${symbol}&interval=${interval}&size=80`)
      const json = await res.json()
      if (json.success) setCandles(json.data)
    } catch {}
    setCandleLoad(false)
  }

  async function fetchOpenOrders() {
    try {
      const res  = await fetch('/api/lbank/trading', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key':apiKey, 'x-lbank-secret':apiSecret },
        body: JSON.stringify({ action:'open_orders', symbol }),
      })
      const json = await res.json()
      if (json.success) setOpenOrders(json.data ?? [])
    } catch {}
  }

  async function cancelOrder(orderId: string) {
    try {
      await fetch('/api/lbank/trading', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key':apiKey, 'x-lbank-secret':apiSecret },
        body: JSON.stringify({ action:'cancel_order', symbol, orderId }),
      })
      fetchOpenOrders()
    } catch {}
  }

  async function placeOrder() {
    if (!isConnected || !amount) return
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/lbank/trading', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-lbank-key':apiKey, 'x-lbank-secret':apiSecret },
        body: JSON.stringify({
          action: 'place_order', symbol, side, type: orderType,
          amount: parseFloat(amount),
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

  // Trade analysis
  const closes  = candles.map(c => c.close)
  const rsi     = calcRSI(closes)
  const macd    = calcMACD(closes)
  const bb      = calcBB(closes)
  const sma20   = calcSMA(closes, 20)
  const sma50   = calcSMA(closes, 50)
  const analysis = candles.length >= 20
    ? getSignal(rsi, macd, ticker?.price ?? 0, bb)
    : null

  const inp: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
    borderRadius:8, padding:'9px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'var(--font-sans)',
  }
  const total = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(4) : '—'

  const TAB_VIEWS: { id: TabView; label: string }[] = [
    { id:'chart',   label:'Chart'    },
    { id:'order',   label:'Order'    },
    { id:'analyse', label:'Analyse'  },
    { id:'orders',  label:'Orders'   },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font-sans)', overflowY:'auto' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:'var(--text)', letterSpacing:'-0.01em' }}>Trade</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:status==='connected'?'var(--green)':'var(--text3)', animation:status==='connected'?'lbP 2s infinite':'none' }} />
              <span style={{ fontSize:9, color:status==='connected'?'var(--green)':'var(--text3)', fontFamily:'var(--font-mono)' }}>{status==='connected'?'Live':'Connecting...'}</span>
            </div>
          </div>
          {ticker && <LivePriceTicker ticker={ticker} />}
        </div>

        {/* Pair selector */}
        <div style={{ display:'flex', gap:5, overflowX:'auto', marginBottom:10 }}>
          {QUICK_PAIRS.map(p => (
            <button key={p} onClick={() => { setSymbol(p); setPrice('') }}
              style={{ padding:'4px 10px', borderRadius:6, fontSize:9, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:symbol===p?'var(--blue)':'var(--bg3)', color:symbol===p?'#fff':'var(--text2)', border:symbol===p?'none':'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
              {p.replace('_usdt','').toUpperCase()}
            </button>
          ))}
        </div>

        {/* View tabs */}
        <div style={{ display:'flex', gap:4 }}>
          {TAB_VIEWS.map(t => (
            <button key={t.id} onClick={() => { setView(t.id); if (t.id==='orders') fetchOpenOrders() }}
              style={{ padding:'5px 12px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:'var(--font-sans)', background:view===t.id?'var(--blue)':'transparent', color:view===t.id?'#fff':'var(--text2)', border:view===t.id?'none':'1px solid var(--border)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHART VIEW ── */}
      {view === 'chart' && (
        <div style={{ padding:'12px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', gap:4, marginBottom:10 }}>
            {INTERVALS.map(iv => (
              <button key={iv.id} onClick={() => setInterval(iv.id)}
                style={{ padding:'3px 8px', borderRadius:5, fontSize:9, cursor:'pointer', background:interval===iv.id?'var(--blue)':'var(--bg3)', color:interval===iv.id?'#fff':'var(--text3)', border:interval===iv.id?'none':'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
                {iv.label}
              </button>
            ))}
          </div>

          {candleLoad ? (
            <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)', borderRadius:10 }}>
              <div style={{ display:'flex', gap:4 }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          ) : candles.length > 0 ? (
            <div style={{ background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', padding:'10px', overflow:'hidden' }}>
              <CandleChart candles={candles} symbol={symbol} height={240} />
            </div>
          ) : (
            <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)', borderRadius:10, color:'var(--text3)', fontSize:12 }}>
              No chart data available
            </div>
          )}

          {book && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:10, fontWeight:500, color:'var(--text)', marginBottom:8 }}>Order Book</div>
              <OrderBookChart book={book} height={90} />
            </div>
          )}
        </div>
      )}

      {/* ── ORDER VIEW ── */}
      {view === 'order' && (
        <div style={{ padding:'16px', flexShrink:0 }}>
          {!isConnected && (
            <div style={{ background:'rgba(26,111,255,0.06)', border:'1px solid rgba(26,111,255,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:11, color:'var(--blue)' }}>
              ⚠ Connect your LBank API key in Settings to trade
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {(['buy','sell'] as Side[]).map(s => (
              <button key={s} onClick={() => setSide(s)}
                style={{ padding:'10px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.05em', background:side===s?(s==='buy'?'var(--green)':'var(--red)'):'var(--bg2)', color:side===s?'#fff':'var(--text2)', border:side===s?'none':'1px solid var(--border)' }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {(['limit','market'] as OrderType[]).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                style={{ padding:'5px 14px', borderRadius:6, fontSize:10, cursor:'pointer', textTransform:'capitalize', background:orderType===t?'rgba(26,111,255,0.15)':'transparent', color:orderType===t?'var(--blue)':'var(--text3)', border:orderType===t?'1px solid rgba(26,111,255,0.3)':'1px solid var(--border)' }}>
                {t}
              </button>
            ))}
          </div>

          {orderType === 'limit' && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Price (USDT)</div>
              <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Enter price" type="number" style={inp}
                onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
          )}

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Amount</div>
            <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount" type="number" style={inp}
              onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
            <div style={{ display:'flex', gap:4, marginTop:6 }}>
              {[25,50,75,100].map(pct => (
                <button key={pct} onClick={() => setAmount((pct/100).toFixed(4))}
                  style={{ flex:1, padding:'3px', borderRadius:5, fontSize:9, cursor:'pointer', background:'var(--bg3)', color:'var(--text3)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {orderType === 'limit' && amount && price && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, marginBottom:12 }}>
              <span style={{ fontSize:10, color:'var(--text3)' }}>Total</span>
              <span style={{ fontSize:10, fontWeight:500, color:'var(--text)', fontFamily:'var(--font-mono)' }}>{total} USDT</span>
            </div>
          )}

          {result && (
            <div style={{ padding:'9px 12px', borderRadius:8, marginBottom:12, background:result.success?'rgba(0,192,135,0.08)':'rgba(240,79,90,0.08)', border:`1px solid ${result.success?'rgba(0,192,135,0.25)':'rgba(240,79,90,0.25)'}`, color:result.success?'var(--green)':'var(--red)', fontSize:11 }}>
              {result.message}
            </div>
          )}

          <button onClick={placeOrder} disabled={loading||!isConnected||!amount}
            style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:13, fontWeight:500, cursor:loading||!isConnected||!amount?'not-allowed':'pointer', background:!isConnected||!amount?'var(--bg3)':side==='buy'?'var(--green)':'var(--red)', color:!isConnected||!amount?'var(--text3)':'#fff', border:'none', opacity:loading?0.7:1, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            {loading ? 'Placing...' : `${side.toUpperCase()} ${symbol.replace('_usdt','').toUpperCase()}`}
          </button>

          <div style={{ fontSize:9, color:'var(--text3)', textAlign:'center' }}>
            ⚠ Trading carries risk — only trade what you can afford to lose
          </div>
        </div>
      )}

      {/* ── ANALYSE VIEW ── */}
      {view === 'analyse' && (
        <div style={{ padding:'16px', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:14, letterSpacing:'-0.01em' }}>
            Trade Analyser — {symbol.replace('_usdt','').toUpperCase()}/USDT
          </div>

          {candles.length < 20 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:12 }}>
              Need at least 20 candles. Switch to 1H or 4H interval on the Chart tab.
            </div>
          ) : (
            <>
              {/* Overall signal */}
              {analysis && (
                <div style={{ background:'var(--bg2)', border:`1px solid ${analysis.color}33`, borderRadius:12, padding:'16px', marginBottom:14, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'var(--font-mono)', marginBottom:8 }}>Signal</div>
                  <div style={{ fontSize:22, fontWeight:600, color:analysis.color, letterSpacing:'-0.01em', marginBottom:6 }}>{analysis.signal}</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:3 }}>
                    {[-3,-2,-1,0,1,2,3].map(v => (
                      <div key={v} style={{ width:18, height:6, borderRadius:3, background: v <= analysis.score ? analysis.color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:'var(--text3)', marginTop:6, fontFamily:'var(--font-mono)' }}>Score: {analysis.score > 0 ? '+' : ''}{analysis.score}/3</div>
                </div>
              )}

              {/* Indicators */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { label:'RSI (14)',   value:rsi.toFixed(1),           color: rsi<30?'var(--green)':rsi>70?'var(--red)':'var(--text2)',    note: rsi<30?'Oversold':rsi>70?'Overbought':'Neutral' },
                  { label:'MACD Hist', value:macd.hist.toFixed(4),      color: macd.hist>0?'var(--green)':'var(--red)',                      note: macd.hist>0?'Bullish':'Bearish' },
                  { label:'SMA 20',    value:`$${sma20.toFixed(2)}`,    color: (ticker?.price??0)>sma20?'var(--green)':'var(--red)',          note: (ticker?.price??0)>sma20?'Above':'Below' },
                  { label:'SMA 50',    value:`$${sma50.toFixed(2)}`,    color: (ticker?.price??0)>sma50?'var(--green)':'var(--red)',          note: (ticker?.price??0)>sma50?'Above':'Below' },
                  { label:'BB Upper',  value:`$${bb.upper.toFixed(2)}`, color:'var(--text2)', note:'Resistance' },
                  { label:'BB Lower',  value:`$${bb.lower.toFixed(2)}`, color:'var(--text2)', note:'Support'    },
                ].map(ind => (
                  <div key={ind.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', marginBottom:4 }}>{ind.label}</div>
                    <div style={{ fontSize:13, fontWeight:500, color:ind.color, fontFamily:'var(--font-mono)' }}>{ind.value}</div>
                    <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>{ind.note}</div>
                  </div>
                ))}
              </div>

              {/* Reasons */}
              {analysis && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:500, color:'var(--text)', marginBottom:10 }}>Signal Reasons</div>
                  {analysis.reasons.map((r, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom: i < analysis.reasons.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize:10, color:analysis.color, flexShrink:0 }}>{analysis.score > 0 ? '↑' : analysis.score < 0 ? '↓' : '→'}</span>
                      <span style={{ fontSize:10, color:'var(--text3)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize:9, color:'var(--text3)', textAlign:'center', marginTop:12, lineHeight:1.5 }}>
                ⚠ Technical analysis is not financial advice. Always do your own research.
              </div>
            </>
          )}
        </div>
      )}

      {/* ── OPEN ORDERS VIEW ── */}
      {view === 'orders' && (
        <div style={{ padding:'16px', flexShrink:0 }}>
          {!isConnected ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:12 }}>Connect your LBank API key in Settings to see orders</div>
          ) : openOrders.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:4 }}>No open orders</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Your open orders for {symbol.replace('_usdt','').toUpperCase()} will appear here</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {openOrders.map(o => (
                <div key={o.orderId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px' }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:500, color:o.side?.includes('buy')?'var(--green)':'var(--red)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {o.side?.includes('buy')?'BUY':'SELL'} {o.symbol?.replace('_usdt','').toUpperCase()}
                    </div>
                    <div style={{ fontSize:9, color:'var(--text3)', marginTop:2, fontFamily:'var(--font-mono)' }}>
                      {o.amount} @ ${parseFloat(o.price||0).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => cancelOrder(o.orderId)}
                    style={{ fontSize:10, padding:'4px 10px', borderRadius:6, background:'rgba(240,79,90,0.08)', color:'var(--red)', border:'1px solid rgba(240,79,90,0.2)', cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes lbP{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
