'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'

type Mode = 'assistant' | 'analyst' | 'trader' | 'educator'

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'assistant', label: 'Assistant', desc: 'General help'      },
  { id: 'analyst',   label: 'Analyst',   desc: 'Market analysis'   },
  { id: 'trader',    label: 'Trader',    desc: 'Execute trades'     },
  { id: 'educator',  label: 'Educator',  desc: 'Learn crypto'       },
]

const SUGGESTIONS = [
  'What is the current BTC price?',
  'Show me the top movers today',
  'Analyze ETH market sentiment',
  'Explain DeFi yield farming',
  'What are the best trading pairs on LBank?',
]

export default function ChatTab() {
  const { chatMessages, chatMode, addChatMessage, clearChat, setChatMode, apiKey, apiSecret } = useStore()
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || streaming) return
    setInput('')

    addChatMessage({ role: 'user', content: msg })
    setStreaming(true)

    const allMsgs = [
      ...chatMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: msg },
    ]

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages:    allMsgs,
          mode:        chatMode,
          credentials: apiKey ? { apiKey, secretKey: apiSecret } : undefined,
        }),
      })

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      // Add empty assistant message to stream into
      addChatMessage({ role: 'assistant', content: '' })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'text') {
              full += data.text
              // Update last message
              useStore.setState(s => {
                const msgs = [...s.chatMessages]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: full }
                return { chatMessages: msgs }
              })
            }
          } catch {}
        }
      }
    } catch (err: any) {
      addChatMessage({ role: 'assistant', content: `❌ Error: ${err.message}` })
    }

    setStreaming(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:"'DM Mono','Space Mono',monospace" }}>

      {/* Mode selector */}
      <div style={{ display:'flex', gap:6, padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0, overflowX:'auto' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setChatMode(m.id)}
            style={{ padding:'5px 12px', borderRadius:8, fontSize:10, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background: chatMode===m.id ? 'var(--blue)' : 'var(--bg3)', color: chatMode===m.id ? '#fff' : 'var(--text2)', border: chatMode===m.id ? 'none' : '1px solid var(--border)' }}>
            {m.label}
          </button>
        ))}
        <button onClick={clearChat} style={{ marginLeft:'auto', padding:'5px 12px', borderRadius:8, fontSize:10, cursor:'pointer', background:'transparent', color:'var(--text3)', border:'1px solid var(--border)', whiteSpace:'nowrap', flexShrink:0 }}>
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {chatMessages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:900 }}>LB</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Ask LBrain anything</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Live LBank data · 15 skills · Kimi K2</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', maxWidth:360 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ padding:'8px 12px', borderRadius:8, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:11, cursor:'pointer', textAlign:'left' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.role==='user' ? 'flex-end' : 'flex-start', gap:4 }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize:9, color:'var(--text3)', paddingLeft:2 }}>LBrain</div>
              )}
              <div style={{
                maxWidth:'85%', padding:'10px 14px', borderRadius: msg.role==='user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                background: msg.role==='user' ? 'var(--blue)' : 'var(--bg2)',
                color: msg.role==='user' ? '#fff' : 'var(--text)',
                border: msg.role==='assistant' ? '1px solid var(--border)' : 'none',
                fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap',
              }}>
                {msg.content || <span style={{ display:'flex', gap:4 }}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>}
              </div>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', paddingLeft:2 }}>
                  {msg.toolsUsed.map(t => (
                    <span key={t} style={{ fontSize:8, padding:'1px 6px', borderRadius:4, background:'rgba(26,111,255,0.1)', color:'var(--blue)', border:'1px solid rgba(26,111,255,0.2)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about LBank markets, prices, your portfolio..."
            rows={1}
            style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:10, padding:'10px 14px', fontSize:12, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.5 }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--blue)'}
            onBlur={e  => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
          />
          <button onClick={() => sendMessage()} disabled={streaming || !input.trim()}
            style={{ width:40, height:40, borderRadius:10, background: streaming||!input.trim() ? 'var(--bg3)' : 'var(--blue)', border:'none', cursor: streaming||!input.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {streaming
              ? <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'lbSpin 0.8s linear infinite' }} />
              : <span style={{ color:'#fff', fontSize:16 }}>↑</span>
            }
          </button>
        </div>
        <div style={{ fontSize:9, color:'var(--text3)', marginTop:6, textAlign:'center' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>

      <style>{`@keyframes lbSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
