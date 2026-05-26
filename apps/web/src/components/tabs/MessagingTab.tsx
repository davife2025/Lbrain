'use client'

import { useState } from 'react'

const COMMANDS = [
  { cmd:'/price BTC',    desc:'Get live LBank price'       },
  { cmd:'/movers',       desc:'Top 24h gainers & losers'   },
  { cmd:'/summary ETH',  desc:'Full market summary'        },
  { cmd:'/help',         desc:'Show all commands'          },
  { cmd:'Ask anything',  desc:'Natural language AI queries' },
]

const SETUP_STEPS = [
  { n:1, title:'Install OpenClaw',        desc:'Run: npm install -g openclaw (requires Node 22+)' },
  { n:2, title:'Run onboarding',          desc:'Run: openclaw onboard --install-daemon' },
  { n:3, title:'Set gateway URL',         desc:'Paste your app URL + /api/openclaw/message into OpenClaw dashboard' },
  { n:4, title:'Set shared secret',       desc:'Copy OPENCLAW_SECRET from your .env and paste into OpenClaw dashboard' },
  { n:5, title:'Set Telegram webhook',    desc:'Run the curl command below to connect your bot' },
]

export default function MessagingTab() {
  const [botToken,  setBotToken]  = useState('')
  const [appUrl,    setAppUrl]    = useState('')
  const [secret,    setSecret]    = useState('')
  const [testing,   setTesting]   = useState(false)
  const [testRes,   setTestRes]   = useState<{ success: boolean; message: string } | null>(null)
  const [copied,    setCopied]    = useState('')

  const webhookCmd = botToken && appUrl
    ? `curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" -H "Content-Type: application/json" -d "{\\"url\\": \\"${appUrl}/api/openclaw/message\\"}"`
    : ''

  async function testGateway() {
    if (!appUrl || !secret) return
    setTesting(true); setTestRes(null)
    try {
      const res  = await fetch(`${appUrl}/api/openclaw/message`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-openclaw-token': secret },
        body:    JSON.stringify({ message: '/help', channel: 'test', sender: 'lbrain-test' }),
      })
      if (res.ok) {
        const json = await res.json()
        setTestRes({ success: true, message: `Gateway connected! Reply: ${json.reply?.slice(0,80)}...` })
      } else {
        setTestRes({ success: false, message: `Gateway returned ${res.status}` })
      }
    } catch (err: any) {
      setTestRes({ success: false, message: err.message })
    }
    setTesting(false)
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const inp: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:11, outline:'none', width:'100%', fontFamily:'inherit' }

  return (
    <div style={{ padding:'20px 16px 40px', fontFamily:"'DM Mono','Space Mono',monospace", maxWidth:520, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Messaging</div>
        <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Connect Telegram via OpenClaw gateway</div>
      </div>

      {/* What you can do */}
      <div style={{ background:'rgba(26,111,255,0.06)', border:'1px solid rgba(26,111,255,0.15)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--blue)', marginBottom:10 }}>📱 What you can do</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {COMMANDS.map(c => (
            <div key={c.cmd} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <code style={{ fontSize:10, color:'var(--text2)', background:'var(--bg3)', padding:'2px 6px', borderRadius:4 }}>{c.cmd}</code>
              <span style={{ fontSize:9, color:'var(--text3)' }}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup steps */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Setup Steps</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {SETUP_STEPS.map(step => (
            <div key={step.n} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1 }}>
                {step.n}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{step.title}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config form */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Configuration</div>

        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>YOUR APP URL</div>
          <input value={appUrl} onChange={e=>setAppUrl(e.target.value)} placeholder="https://your-app.vercel.app" style={inp}
            onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>OPENCLAW SECRET</div>
          <input value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Your OPENCLAW_SECRET value" style={inp}
            onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:4 }}>TELEGRAM BOT TOKEN</div>
          <input value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="123456:ABCdef..." style={inp}
            onFocus={e=>(e.target as HTMLElement).style.borderColor='var(--blue)'}
            onBlur={e =>(e.target as HTMLElement).style.borderColor='var(--border)'} />
          <div style={{ fontSize:9, color:'var(--text3)', marginTop:4 }}>
            Get from <span style={{ color:'var(--blue)' }}>@BotFather</span> on Telegram
          </div>
        </div>

        {testRes && (
          <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:10, background: testRes.success?'rgba(0,192,135,0.08)':'rgba(240,79,90,0.08)', border:`1px solid ${testRes.success?'rgba(0,192,135,0.25)':'rgba(240,79,90,0.25)'}`, color: testRes.success?'var(--green)':'var(--red)', fontSize:10 }}>
            {testRes.message}
          </div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={testGateway} disabled={testing||!appUrl||!secret}
            style={{ flex:1, padding:'8px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor: testing||!appUrl||!secret?'not-allowed':'pointer', opacity: !appUrl||!secret?0.5:1 }}>
            {testing ? 'Testing...' : 'Test Gateway'}
          </button>
        </div>
      </div>

      {/* Webhook command */}
      {webhookCmd && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>Set Telegram Webhook</div>
            <button onClick={() => copy(webhookCmd, 'webhook')}
              style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background: copied==='webhook'?'rgba(0,192,135,0.1)':'var(--bg3)', color: copied==='webhook'?'var(--green)':'var(--text2)', border:'1px solid var(--border)', cursor:'pointer' }}>
              {copied==='webhook' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', fontSize:9, color:'var(--text2)', fontFamily:'monospace', wordBreak:'break-all', lineHeight:1.6 }}>
            {webhookCmd}
          </div>
          <div style={{ fontSize:9, color:'var(--text3)', marginTop:6 }}>Run this in your terminal (PowerShell: use curl.exe)</div>
        </div>
      )}

      {/* OpenClaw link */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:14, textAlign:'center' }}>
        <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6 }}>Need OpenClaw?</div>
        <a href="https://openclaw.ai" target="_blank" rel="noreferrer"
          style={{ fontSize:11, color:'var(--blue)', textDecoration:'none', fontWeight:600 }}>
          openclaw.ai →
        </a>
      </div>
    </div>
  )
}
