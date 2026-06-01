'use client'

import { useState, useEffect, Suspense } from 'react'
import { useLBankTicker } from '@/hooks/useLBankTicker'
import { useLBankOrderBook } from '@/hooks/useLBankOrderBook'
import LivePriceTicker from '@/components/charts/LivePriceTicker'
import OrderBookChart from '@/components/charts/OrderBookChart'
import CandleChart from '@/components/charts/CandleChart'
import { TickerSkeleton, PageLoader } from '@/components/Loading'
import ErrorBoundary from '@/components/ErrorBoundary'

interface StaticTicker {
  symbol:    string
  price:     number
  high:      number
  low:       number
  volume:    number
  changePct: number
}

const FILTER_TABS  = ['All', 'Gainers', 'Losers', 'USDT']
const TOP_SYMBOLS  = ['btc_usdt','eth_usdt','ltc_usdt','xrp_usdt','bnb_usdt','sol_usdt','doge_usdt','ada_usdt']
const INTERVALS    = [{ id:'minute5',label:'5m'},{ id:'minute15',label:'15m'},{ id:'hour1',label:'1H'},{ id:'hour4',label:'4H'},{ id:'day1',label:'1D'}]

export default function MarketsTab() {
  const [tickers,    setTickers]    = useState<StaticTicker[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [filterTab,  setFilterTab]  = useState('All')
  const [sort,       setSort]       = useState<'volume'|'change'|'price'>('volume')
  const [selected,   setSelected]   = useState<string|null>(null)
  const [candles,    setCandles]    = useState<any[]>([])
  const [candleLoad, setCandleLoad] = useState(false)
  const [interval,   setInterval]   = useState('hour1')

  const { tickers: live, status } = useLBankTicker(TOP_SYMBOLS)
  const { book }                  = useLBankOrderBook(selected ?? '')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (selected) fetchCandles(selected, interval) }, [selected, interval])

  async function fetchAll() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/lbank/market?skill=all-tickers')
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to load')
      setTickers(json.data)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function fetchCandles(sym: string, iv: string) {
    setCandleLoad(true)
    try {
      const res  = await fetch(`/api/lbank/market?skill=klines&symbol=${sym}&interval=${iv}&size=80`)
      const json = await res.json()
      if (json.success) setCandles(json.data)
    } catch {}
    setCandleLoad(false)
  }

  const merged = tickers.map(t => {
    const l = live[t.symbol]
    return l ? { ...t, price:l.price, changePct:l.changePct, high:l.high, low:l.low, volume:l.volume } : t
  })

  const filtered = merged
    .filter(t => {
      if (filterTab==='USDT')    return t.symbol.endsWith('_usdt')
      if (filterTab==='Gainers') return t.changePct > 0
      if (filterTab==='Losers')  return t.changePct < 0
      return true
    })
    .filter(t => !search || t.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort==='change' ? Math.abs(b.changePct)-Math.abs(a.changePct) : sort==='price' ? b.price-a.price : b.volume-a.volume)
    .slice(0, 100)

  const fmt    = (n: number) => n>=1000 ? `$${(n/1000).toFixed(2)}k` : `$${n.toFixed(n<1?6:2)}`
  const fmtVol = (n: number) => n>=1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n>=1000 ? `${(n/1000).toFixed(0)}K` : n.toFixed(0)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:'var(--text)', letterSpacing:'-0.01em' }}>Markets</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background: status==='connected'?'var(--green)':'var(--text3)', animation: status==='connected'?'lbP 2s infinite':'none' }} />
              <span style={{ fontSize:9, color: status==='connected'?'var(--green)':'var(--text3)', fontFamily:'var(--font-mono)' }}>{status==='connected'?'Live streaming':status}</span>
            </div>
          </div>
          <button onClick={fetchAll} style={{ padding:'5px 10px', borderRadius:7, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:9, cursor:'pointer', fontFamily:'var(--font-mono)' }}>↻ Refresh</button>
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pair..."
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:7, padding:'7px 12px', fontSize:11, outline:'none', marginBottom:8, fontFamily:'var(--font-sans)' }}
          onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
          onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />

        <div style={{ display:'flex', gap:5 }}>
          {FILTER_TABS.map(t => (
            <button key={t} onClick={() => setFilterTab(t)}
              style={{ padding:'4px 10px', borderRadius:6, fontSize:9, cursor:'pointer', background:filterTab===t?'var(--blue)':'var(--bg3)', color:filterTab===t?'#fff':'var(--text2)', border:filterTab===t?'none':'1px solid var(--border)', fontFamily:'var(--font-sans)' }}>
              {t}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:3 }}>
            {(['volume','change','price'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding:'4px 7px', borderRadius:5, fontSize:8, cursor:'pointer', background:sort===s?'rgba(26,111,255,0.15)':'transparent', color:sort===s?'var(--blue)':'var(--text3)', border:sort===s?'1px solid rgba(26,111,255,0.3)':'1px solid transparent', fontFamily:'var(--font-mono)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected detail panel */}
      {selected && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', letterSpacing:'-0.01em' }}>
                {selected.replace('_usdt','').toUpperCase()}<span style={{ color:'var(--text3)', fontWeight:400 }}>/USDT</span>
              </div>
              <LivePriceTicker ticker={live[selected] ?? null} />
            </div>
            <button onClick={()=>setSelected(null)} style={{ fontSize:12, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', padding:4 }}>✕</button>
          </div>

          <div style={{ display:'flex', gap:4, marginBottom:10 }}>
            {INTERVALS.map(iv => (
              <button key={iv.id} onClick={() => setInterval(iv.id)}
                style={{ padding:'3px 8px', borderRadius:5, fontSize:9, cursor:'pointer', background:interval===iv.id?'var(--blue)':'var(--bg3)', color:interval===iv.id?'#fff':'var(--text3)', border:interval===iv.id?'none':'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
                {iv.label}
              </button>
            ))}
          </div>

          <ErrorBoundary>
            {candleLoad ? (
              <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <PageLoader label="Loading chart..." />
              </div>
            ) : candles.length > 0 ? (
              <div style={{ width:'100%', marginBottom:12, borderRadius:8, overflow:'hidden', background:'var(--bg3)', padding:'8px' }}>
                <CandleChart candles={candles} symbol={selected} height={220} />
              </div>
            ) : null}
          </ErrorBoundary>

          {book && (
            <ErrorBoundary>
              <OrderBookChart book={book} height={90} />
            </ErrorBoundary>
          )}
        </div>
      )}

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 70px', padding:'6px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {['Pair','Price','24h %','Volume'].map(h => (
          <div key={h} style={{ fontSize:8, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:h==='Pair'?'left':'right', fontFamily:'var(--font-mono)' }}>{h}</div>
        ))}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <TickerSkeleton rows={12} />
        ) : error ? (
          <div style={{ padding:24, textAlign:'center' }}>
            <div style={{ fontSize:12, color:'var(--red)', marginBottom:8, fontFamily:'var(--font-mono)' }}>{error}</div>
            <button onClick={fetchAll} style={{ padding:'6px 14px', borderRadius:8, background:'var(--blue)', color:'#fff', border:'none', cursor:'pointer', fontSize:11 }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text3)' }}>No results for "{search}"</div>
        ) : (
          filtered.map(t => {
            const isLive     = !!live[t.symbol]
            const isSelected = selected === t.symbol
            return (
              <div key={t.symbol}
                onClick={() => setSelected(isSelected ? null : t.symbol)}
                style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 70px', padding:'9px 16px', borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer', background:isSelected?'rgba(26,111,255,0.05)':'transparent', borderLeft:`2px solid ${isSelected?'var(--blue)':'transparent'}`, transition:'background 0.1s' }}
                onMouseEnter={e=>{ if(!isSelected)(e.currentTarget as HTMLElement).style.background='var(--bg2)' }}
                onMouseLeave={e=>{ if(!isSelected)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'rgba(26,111,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:600, color:'var(--blue)', flexShrink:0, fontFamily:'var(--font-sans)' }}>
                    {t.symbol.replace('_usdt','').replace('_btc','').slice(0,3).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:500, color:'var(--text)', fontFamily:'var(--font-sans)' }}>
                      {t.symbol.replace('_usdt','').replace('_btc','').toUpperCase()}
                    </div>
                    <div style={{ fontSize:8, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                      {t.symbol.includes('_usdt')?'USDT':t.symbol.includes('_btc')?'BTC':''}
                    </div>
                  </div>
                  {isLive && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--green)', animation:'lbP 2s infinite', flexShrink:0 }} />}
                </div>
                <div style={{ fontSize:11, color:'var(--text)', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:400 }}>{fmt(t.price)}</div>
                <div style={{ fontSize:11, fontWeight:500, textAlign:'right', color:t.changePct>=0?'var(--green)':'var(--red)', fontFamily:'var(--font-mono)' }}>
                  {t.changePct>=0?'+':''}{t.changePct.toFixed(2)}%
                </div>
                <div style={{ fontSize:9, color:'var(--text3)', textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtVol(t.volume)}</div>
              </div>
            )
          })
        )}
      </div>
      <style>{`@keyframes lbP{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
