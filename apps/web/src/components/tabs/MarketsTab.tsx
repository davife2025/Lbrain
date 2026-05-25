'use client'

import { useState, useEffect } from 'react'

interface Ticker {
  symbol:    string
  price:     number
  high:      number
  low:       number
  volume:    number
  changePct: number
}

const TABS = ['All', 'Gainers', 'Losers', 'USDT']

export default function MarketsTab() {
  const [tickers,  setTickers]  = useState<Ticker[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [sort,     setSort]     = useState<'price' | 'change' | 'volume'>('volume')

  useEffect(() => { fetchTickers() }, [])

  async function fetchTickers() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/lbank/market?skill=all-tickers')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setTickers(json.data)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const filtered = tickers
    .filter(t => {
      if (activeTab === 'USDT')   return t.symbol.endsWith('_usdt')
      if (activeTab === 'Gainers') return t.changePct > 0
      if (activeTab === 'Losers')  return t.changePct < 0
      return true
    })
    .filter(t => !search || t.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'change') return Math.abs(b.changePct) - Math.abs(a.changePct)
      if (sort === 'price')  return b.price - a.price
      return b.volume - a.volume
    })
    .slice(0, 100)

  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(n < 1 ? 6 : 2)}`
  const fmtVol = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n.toFixed(0)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:"'DM Mono','Space Mono',monospace" }}>

      {/* Header */}
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Markets</div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{tickers.length} pairs · LBank</div>
          </div>
          <button onClick={fetchTickers} style={{ padding:'6px 12px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:10, cursor:'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search symbol..."
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:11, outline:'none', marginBottom:10 }}
          onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--blue)'}
          onBlur={e  => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
        />

        {/* Tabs */}
        <div style={{ display:'flex', gap:6 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding:'4px 10px', borderRadius:6, fontSize:10, cursor:'pointer', background: activeTab===t ? 'var(--blue)' : 'var(--bg3)', color: activeTab===t ? '#fff' : 'var(--text2)', border: activeTab===t ? 'none' : '1px solid var(--border)' }}>
              {t}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {(['volume','change','price'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding:'4px 8px', borderRadius:6, fontSize:9, cursor:'pointer', background: sort===s ? 'rgba(26,111,255,0.15)' : 'transparent', color: sort===s ? 'var(--blue)' : 'var(--text3)', border: sort===s ? '1px solid rgba(26,111,255,0.3)' : '1px solid transparent' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', padding:'8px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {['Pair','Price','24h Change','Volume'].map(h => (
          <div key={h} style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', textAlign: h==='Price'||h==='24h Change'||h==='Volume' ? 'right' : 'left' }}>{h}</div>
        ))}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
            <div style={{ display:'flex', gap:4 }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        ) : error ? (
          <div style={{ padding:24, textAlign:'center' }}>
            <div style={{ fontSize:12, color:'var(--red)', marginBottom:8 }}>{error}</div>
            <button onClick={fetchTickers} style={{ padding:'6px 14px', borderRadius:8, background:'var(--blue)', color:'#fff', border:'none', cursor:'pointer', fontSize:11 }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text3)' }}>No results found</div>
        ) : (
          filtered.map(t => (
            <div key={t.symbol} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>
                {t.symbol.replace('_usdt','').replace('_btc','').toUpperCase()}
                <span style={{ fontSize:9, color:'var(--text3)', marginLeft:4 }}>{t.symbol.includes('_usdt') ? '/USDT' : t.symbol.includes('_btc') ? '/BTC' : ''}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text)', textAlign:'right' }}>{fmt(t.price)}</div>
              <div style={{ fontSize:11, fontWeight:600, textAlign:'right', color: t.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', textAlign:'right' }}>{fmtVol(t.volume)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
