'use client'

import { useState, useEffect } from 'react'
import { agentEngine, type AgentLog } from '@/lib/agentEngine'
import { useStore } from '@/lib/store'

interface Rule {
  id:           string
  name:         string
  trigger:      string
  triggerValue: number
  action:       string
  symbol:       string
  active:       boolean
  lastRun:      string | null
  createdAt:    string
}

const TRIGGERS = ['price_above','price_below','rsi_above','rsi_below','daily_time']
const ACTIONS  = ['buy_market','sell_market','send_alert','post_report','cancel_all']

const TRIGGER_LABELS: Record<string,string> = {
  price_above: 'Price above $',
  price_below: 'Price below $',
  rsi_above:   'RSI above',
  rsi_below:   'RSI below',
  daily_time:  'Daily at (HH)',
}
const ACTION_LABELS: Record<string,string> = {
  buy_market:  'Buy Market',
  sell_market: 'Sell Market',
  send_alert:  'Send Alert',
  post_report: 'Post Report',
  cancel_all:  'Cancel All Orders',
}

export default function AgentTab() {
  const { autoTradeEnabled } = useStore()
  const [rules,   setRules]   = useState<Rule[]>([])
  const [logs,    setLogs]    = useState<AgentLog[]>([])
  const [adding,  setAdding]  = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [name,    setName]    = useState('')
  const [trigger, setTrigger] = useState('price_above')
  const [trigVal, setTrigVal] = useState('')
  const [action,  setAction]  = useState('send_alert')
  const [symbol,  setSymbol]  = useState('BTC')

  useEffect(() => {
    // Load rules
    try {
      const saved = localStorage.getItem('lbrain-rules')
      if (saved) setRules(JSON.parse(saved))
    } catch {}
    // Load logs from engine
    setLogs(agentEngine.getLogs())
    // Subscribe to new logs
    const unsub = agentEngine.onLog(log => {
      setLogs(prev => [log, ...prev].slice(0, 100))
    })
    return unsub
  }, [])

  useEffect(() => {
    localStorage.setItem('lbrain-rules', JSON.stringify(rules))
  }, [rules])

  function addRule() {
    if (!name || !trigVal) return
    const rule: Rule = {
      id:           crypto.randomUUID(),
      name,
      trigger,
      triggerValue: parseFloat(trigVal),
      action,
      symbol:       symbol.toUpperCase(),
      active:       true,
      lastRun:      null,
      createdAt:    new Date().toISOString(),
    }
    setRules(r => [...r, rule])
    setName(''); setTrigVal(''); setAdding(false)
  }

  function toggleRule(id: string) { setRules(r => r.map(rule => rule.id===id ? { ...rule, active: !rule.active } : rule)) }
  function deleteRule(id: string) { setRules(r => r.filter(rule => rule.id !== id)) }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit' }
  const sel: React.CSSProperties = { ...inp, cursor:'pointer' }

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:520, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Auto Agent</div>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>
            {rules.filter(r=>r.active).length} active rules · checks every 60s
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setShowLog(v => !v)}
            style={{ padding:'6px 12px', borderRadius:8, background: showLog?'rgba(26,111,255,0.15)':'var(--bg2)', border:`1px solid ${showLog?'rgba(26,111,255,0.3)':'var(--border)'}`, color: showLog?'var(--blue)':'var(--text2)', fontSize:10, cursor:'pointer' }}>
            Logs {logs.length > 0 ? `(${logs.length})` : ''}
          </button>
          <button onClick={() => setAdding(v => !v)}
            style={{ padding:'6px 14px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:10, cursor:'pointer', fontWeight:600 }}>
            + Rule
          </button>
        </div>
      </div>

      {/* Auto-trade warning */}
      {!autoTradeEnabled && (
        <div style={{ background:'rgba(240,185,11,0.06)', border:'1px solid rgba(240,185,11,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:10, color:'#f59e0b' }}>
          ⚠ Auto-trade is OFF — trading actions will be skipped. Enable in Settings.
        </div>
      )}

      {/* Execution logs */}
      {showLog && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>Execution Log</span>
            <button onClick={() => { agentEngine.clearLogs(); setLogs([]) }} style={{ fontSize:9, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer' }}>Clear</button>
          </div>
          {logs.length === 0 ? (
            <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', padding:'12px 0' }}>No executions yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${log.success?'rgba(0,192,135,0.15)':'rgba(240,79,90,0.15)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:9, fontWeight:600, color:'var(--text2)' }}>{log.ruleName}</span>
                    <span style={{ fontSize:8, color:'var(--text3)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize:9, color: log.success?'var(--green)':'var(--red)' }}>{log.result}</div>
                  <div style={{ fontSize:8, color:'var(--text3)', marginTop:2 }}>{log.symbol} @ ${log.price.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add rule form */}
      {adding && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>New Agent Rule</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>RULE NAME</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. BTC Take Profit" style={inp}
              onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>SYMBOL</div>
              <input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="BTC" style={inp}
                onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>TRIGGER VALUE</div>
              <input value={trigVal} onChange={e=>setTrigVal(e.target.value)} placeholder="105000" type="number" style={inp}
                onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
                onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>TRIGGER</div>
              <select value={trigger} onChange={e=>setTrigger(e.target.value)} style={sel}>
                {TRIGGERS.map(t => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>ACTION</div>
              <select value={action} onChange={e=>setAction(e.target.value)} style={sel}>
                {ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background:'rgba(26,111,255,0.06)', border:'1px solid rgba(26,111,255,0.15)', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:10, color:'var(--blue)' }}>
            IF {symbol.toUpperCase()} {TRIGGER_LABELS[trigger]}{trigVal} → {ACTION_LABELS[action]}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addRule} style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>Create Rule</button>
            <button onClick={() => setAdding(false)} style={{ padding:'8px 16px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No rules yet</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Create IF/THEN rules to automate your strategy</div>
          <button onClick={() => setAdding(true)} style={{ padding:'8px 20px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>+ New Rule</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rules.map(rule => (
            <div key={rule.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', opacity: rule.active?1:0.5 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{rule.name}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {rule.lastRun && (
                    <span style={{ fontSize:8, color:'var(--green)', padding:'1px 5px', borderRadius:3, background:'rgba(0,192,135,0.1)' }}>ran</span>
                  )}
                  <button onClick={() => toggleRule(rule.id)}
                    style={{ fontSize:8, padding:'2px 8px', borderRadius:4, cursor:'pointer', background: rule.active?'rgba(26,111,255,0.1)':'rgba(255,255,255,0.05)', color: rule.active?'var(--blue)':'var(--text3)', border: rule.active?'1px solid rgba(26,111,255,0.2)':'1px solid var(--border)' }}>
                    {rule.active?'ON':'OFF'}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} style={{ fontSize:10, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'6px 8px' }}>
                IF {rule.symbol} {TRIGGER_LABELS[rule.trigger]}{rule.triggerValue} → <span style={{ color:'var(--blue)' }}>{ACTION_LABELS[rule.action]}</span>
              </div>
              {rule.lastRun && (
                <div style={{ fontSize:8, color:'var(--text3)', marginTop:4 }}>
                  Last run: {new Date(rule.lastRun).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
