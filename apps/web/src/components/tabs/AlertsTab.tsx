'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id:        string
  symbol:    string
  condition: 'above' | 'below'
  target:    number
  note:      string
  active:    boolean
  createdAt: string
}

export default function AlertsTab() {
  const [alerts,  setAlerts]  = useState<Alert[]>([])
  const [symbol,  setSymbol]  = useState('')
  const [cond,    setCond]    = useState<'above'|'below'>('above')
  const [target,  setTarget]  = useState('')
  const [note,    setNote]    = useState('')
  const [adding,  setAdding]  = useState(false)
  const [prices,  setPrices]  = useState<Record<string,number>>({})

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lbrain-alerts')
      if (saved) setAlerts(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('lbrain-alerts', JSON.stringify(alerts))
    // Fetch current prices for active alerts
    const syms = [...new Set(alerts.filter(a => a.active).map(a => a.symbol))]
    syms.forEach(async sym => {
      try {
        const res  = await fetch(`/api/lbank/market?skill=ticker&symbol=${sym.toLowerCase()}_usdt`)
        const json = await res.json()
        if (json.success) setPrices(p => ({ ...p, [sym]: json.data.price }))
      } catch {}
    })
  }, [alerts])

  function addAlert() {
    if (!symbol || !target) return
    const alert: Alert = {
      id:        crypto.randomUUID(),
      symbol:    symbol.toUpperCase(),
      condition: cond,
      target:    parseFloat(target),
      note,
      active:    true,
      createdAt: new Date().toISOString(),
    }
    setAlerts(a => [...a, alert])
    setSymbol(''); setTarget(''); setNote(''); setAdding(false)
  }

  function toggleAlert(id: string) {
    setAlerts(a => a.map(al => al.id===id ? { ...al, active: !al.active } : al))
  }

  function deleteAlert(id: string) {
    setAlerts(a => a.filter(al => al.id !== id))
  }

  function isTriggered(alert: Alert) {
    const price = prices[alert.symbol]
    if (!price) return false
    return alert.condition==='above' ? price >= alert.target : price <= alert.target
  }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit' }

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:520, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Price Alerts</div>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{alerts.filter(a=>a.active).length} active</div>
        </div>
        <button onClick={() => setAdding(v => !v)}
          style={{ padding:'6px 14px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:10, cursor:'pointer', fontWeight:600 }}>
          + New Alert
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>New Alert</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>COIN</div>
              <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="BTC" style={inp}
                onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>CONDITION</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                {(['above','below'] as const).map(c => (
                  <button key={c} onClick={() => setCond(c)}
                    style={{ padding:'8px', borderRadius:6, fontSize:10, cursor:'pointer', background: cond===c ? 'var(--blue)' : 'var(--bg3)', color: cond===c ? '#fff' : 'var(--text2)', border: cond===c ? 'none' : '1px solid var(--border)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>TARGET PRICE ($)</div>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="105000" type="number" style={inp}
              onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>NOTE (optional)</div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Take profit level" style={inp}
              onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addAlert} style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>Create Alert</button>
            <button onClick={() => setAdding(false)} style={{ padding:'8px 16px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No alerts set</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Get notified when prices hit your targets</div>
          <button onClick={() => setAdding(true)} style={{ padding:'8px 20px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>+ New Alert</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {alerts.map(alert => {
            const triggered = isTriggered(alert)
            const price     = prices[alert.symbol]
            return (
              <div key={alert.id} style={{ background:'var(--bg2)', border:`1px solid ${triggered ? 'rgba(0,192,135,0.4)' : 'var(--border)'}`, borderRadius:12, padding:'14px 16px', opacity: alert.active ? 1 : 0.5 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:'rgba(26,111,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'var(--blue)' }}>
                      {alert.symbol.slice(0,2)}
                    </div>
                    <div>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{alert.symbol}</span>
                      <span style={{ fontSize:10, color: alert.condition==='above' ? 'var(--blue)' : 'var(--red)', marginLeft:6 }}>
                        {alert.condition} ${alert.target.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {triggered && (
                      <span style={{ fontSize:8, padding:'2px 6px', borderRadius:4, background:'rgba(0,192,135,0.1)', color:'var(--green)', border:'1px solid rgba(0,192,135,0.2)' }}>TRIGGERED</span>
                    )}
                    <button onClick={() => toggleAlert(alert.id)}
                      style={{ fontSize:8, padding:'2px 8px', borderRadius:4, cursor:'pointer', background: alert.active ? 'rgba(26,111,255,0.1)' : 'rgba(255,255,255,0.05)', color: alert.active ? 'var(--blue)' : 'var(--text3)', border: alert.active ? '1px solid rgba(26,111,255,0.2)' : '1px solid var(--border)' }}>
                      {alert.active ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)}
                      style={{ fontSize:10, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', padding:'2px 4px' }}>✕</button>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  {alert.note && <span style={{ fontSize:9, color:'var(--text3)' }}>{alert.note}</span>}
                  {price && <span style={{ fontSize:9, color:'var(--text3)' }}>Current: ${price.toLocaleString()}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
