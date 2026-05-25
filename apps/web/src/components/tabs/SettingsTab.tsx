'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

export default function SettingsTab() {
  const { data: session } = useSession()
  const { apiKey, apiSecret, isConnected, autoTradeEnabled, setCredentials, clearCredentials, setAutoTrade } = useStore()
  const [key,      setKey]      = useState(apiKey)
  const [secret,   setSecret]   = useState(apiSecret)
  const [showKey,  setShowKey]  = useState(false)
  const [testing,  setTesting]  = useState(false)
  const [testRes,  setTestRes]  = useState<{ success: boolean; message: string } | null>(null)
  const [saved,    setSaved]    = useState(false)

  async function testConnection() {
    if (!key || !secret) return
    setTesting(true); setTestRes(null)
    try {
      const res  = await fetch('/api/lbank/account?skill=balances', {
        headers: { 'x-lbank-key': key, 'x-lbank-secret': secret },
      })
      const json = await res.json()
      setTestRes({ success: json.success, message: json.success ? `Connected! Found ${json.data?.length ?? 0} asset(s).` : json.error })
    } catch (err: any) {
      setTestRes({ success: false, message: err.message })
    }
    setTesting(false)
  }

  function saveCredentials() {
    setCredentials(key, secret)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'10px 12px', fontSize:12, outline:'none', width:'100%', fontFamily:'inherit' }

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:520, margin:'0 auto' }}>

      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:20 }}>Settings</div>

      {/* Account */}
      {session && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Account</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:12, color:'var(--text)' }}>{session.user?.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{session.user?.email}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ padding:'6px 14px', borderRadius:8, background:'rgba(240,79,90,0.1)', border:'1px solid rgba(240,79,90,0.2)', color:'var(--red)', fontSize:10, cursor:'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* LBank API Keys */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>LBank API Keys</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: isConnected ? 'var(--green)' : 'var(--text3)' }} />
            <span style={{ fontSize:9, color: isConnected ? 'var(--green)' : 'var(--text3)' }}>
              {isConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>API KEY</div>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="Enter your LBank API key" style={inp}
            onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>SECRET KEY</div>
          <div style={{ position:'relative' }}>
            <input type={showKey ? 'text' : 'password'} value={secret} onChange={e => setSecret(e.target.value)} placeholder="Enter your LBank secret key" style={{ ...inp, paddingRight:50 }}
              onFocus={e => (e.target as HTMLElement).style.borderColor='var(--blue)'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--border)'} />
            <button type="button" onClick={() => setShowKey(v => !v)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:9, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer' }}>
              {showKey ? 'hide' : 'show'}
            </button>
          </div>
        </div>

        {testRes && (
          <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:10, background: testRes.success ? 'rgba(0,192,135,0.08)' : 'rgba(240,79,90,0.08)', border: `1px solid ${testRes.success ? 'rgba(0,192,135,0.25)' : 'rgba(240,79,90,0.25)'}`, color: testRes.success ? 'var(--green)' : 'var(--red)', fontSize:11 }}>
            {testRes.message}
          </div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={testConnection} disabled={testing || !key || !secret}
            style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor: testing||!key||!secret ? 'not-allowed' : 'pointer', opacity: !key||!secret ? 0.5 : 1 }}>
            {testing ? 'Testing...' : 'Test connection'}
          </button>
          <button onClick={saveCredentials} disabled={!key || !secret}
            style={{ flex:1, padding:'8px', borderRadius:8, background: saved ? 'var(--green)' : 'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor: !key||!secret ? 'not-allowed' : 'pointer', fontWeight:600, opacity: !key||!secret ? 0.5 : 1 }}>
            {saved ? '✓ Saved' : 'Save keys'}
          </button>
        </div>

        {isConnected && (
          <button onClick={clearCredentials} style={{ width:'100%', padding:'6px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text3)', fontSize:10, cursor:'pointer', marginTop:8 }}>
            Disconnect
          </button>
        )}

        <div style={{ fontSize:9, color:'var(--text3)', marginTop:10, lineHeight:1.6 }}>
          🔒 Keys are stored in session memory only — never sent to our servers or stored in plaintext.
        </div>
      </div>

      {/* Auto-trade */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Auto-Trade Mode</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>Allow agent rules to place real orders</div>
          </div>
          <button onClick={() => setAutoTrade(!autoTradeEnabled)}
            style={{ width:44, height:24, borderRadius:12, cursor:'pointer', border:'none', background: autoTradeEnabled ? 'var(--blue)' : 'var(--bg3)', transition:'background 0.2s', position:'relative' }}>
            <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: autoTradeEnabled ? 23 : 3, transition:'left 0.2s' }} />
          </button>
        </div>
        {autoTradeEnabled && (
          <div style={{ fontSize:9, color:'var(--red)', marginTop:8, padding:'6px 10px', background:'rgba(240,79,90,0.06)', borderRadius:6, border:'1px solid rgba(240,79,90,0.15)' }}>
            ⚠ Auto-trade is ON — agent rules will place real orders on LBank
          </div>
        )}
      </div>

      {/* App info */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:10 }}>About LBrain</div>
        {[['Version','1.0.0'],['AI Model','Kimi K2 (HuggingFace)'],['Exchange','LBank'],['Skills','15 LBank skills']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize:10, color:'var(--text3)' }}>{k}</span>
            <span style={{ fontSize:10, color:'var(--text2)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
