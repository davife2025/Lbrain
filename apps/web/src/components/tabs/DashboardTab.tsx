'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import type { ActiveTab } from '@/lib/store'
import LiveTickerStrip from '@/components/charts/LiveTickerStrip'

const NAV_COLS = [
  [{ id:'chat',      icon:'🤖', label:'AI Assistant', desc:'Ask anything'  },
   { id:'markets',   icon:'📈', label:'Markets',       desc:'Live prices'   }],
  [{ id:'portfolio', icon:'💼', label:'Portfolio',     desc:'Holdings'      },
   { id:'trading',   icon:'⚡', label:'Trade',         desc:'Buy & sell'    }],
  [{ id:'alerts',    icon:'🔔', label:'Alerts',        desc:'Notify me'     },
   { id:'agent',     icon:'🎯', label:'Agent',         desc:'Auto rules'    }],
  [{ id:'learn',     icon:'📚', label:'Learn',         desc:'Education'     },
   { id:'messaging', icon:'💬', label:'Messaging',     desc:'Telegram'      }],
  [{ id:'settings',  icon:'⚙️', label:'Settings',      desc:'Configure'     },
   { id:'home',      icon:'🏠', label:'Dashboard',     desc:'Home'          }],
]

const pBase: React.CSSProperties = {
  padding:'8px 8px 6px',
  background:'rgba(0,0,0,0.2)',
  borderBottom:'1px solid var(--border)',
  minHeight:68,
}

function PreviewChat() {
  return (
    <div style={pBase}>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        <div style={{ fontSize:7, padding:'3px 6px', borderRadius:4, background:'var(--bg3)', color:'var(--text3)', alignSelf:'flex-end' }}>BTC price?</div>
        <div style={{ fontSize:7, padding:'3px 6px', borderRadius:4, background:'rgba(26,111,255,0.08)', color:'var(--blue)', border:'1px solid rgba(26,111,255,0.12)' }}>BTC is $103,420 ↑2.4%</div>
        <div style={{ fontSize:7, padding:'3px 6px', borderRadius:4, background:'var(--bg3)', color:'var(--text3)', alignSelf:'flex-end' }}>Top movers?</div>
      </div>
    </div>
  )
}

function PreviewMarkets() {
  return (
    <div style={pBase}>
      {[['BTC','$103,420','+2.4%',true],['ETH','$3,821','+1.8%',true],['LTC','$89.42','+1.8%',true],['XRP','$0.62','-0.9%',false]].map(([s,v,c,up]) => (
        <div key={s as string} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize:8, color:'var(--text3)' }}>{s}</span>
          <span style={{ fontSize:8, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>{v}</span>
          <span style={{ fontSize:7, color:up?'var(--green)':'var(--red)', fontFamily:'var(--font-mono)' }}>{c}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewPortfolio() {
  return (
    <div style={pBase}>
      {[['BTC',72,'#1a6fff','$4,210'],['ETH',45,'#00c087','$1,840'],['LTC',22,'#f59e0b','$420']].map(([s,p,col,v]) => (
        <div key={s as string} style={{ marginBottom:5 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:col as string }} />
              <span style={{ fontSize:7, color:'var(--text3)' }}>{s}</span>
            </div>
            <span style={{ fontSize:7, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>{v}</span>
          </div>
          <div style={{ width:'100%', height:2, background:'rgba(255,255,255,0.05)', borderRadius:2, marginTop:2 }}>
            <div style={{ width:`${p}%`, height:2, borderRadius:2, background:col as string }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewAlerts() {
  return (
    <div style={pBase}>
      {[['BTC','above $105k','var(--blue)',true],['ETH','below $3.5k','var(--red)',true],['LTC','above $100','var(--blue)',false]].map(([s,c,col,on]) => (
        <div key={s as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)', borderRadius:4, padding:'3px 5px', marginBottom:3 }}>
          <span style={{ fontSize:7, color:'var(--text3)' }}>{s}</span>
          <span style={{ fontSize:7, color:col as string }}>{c}</span>
          <span style={{ fontSize:6, padding:'1px 4px', borderRadius:3, background:on?'rgba(26,111,255,0.1)':'rgba(240,79,90,0.1)', color:on?'var(--blue)':'var(--red)', fontFamily:'var(--font-mono)' }}>{on?'ON':'OFF'}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewTrade() {
  return (
    <div style={pBase}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:38 }}>
        {[28,45,36,62,55,82,70,78].map((h,i) => (
          <div key={i} style={{ flex:1, height:`${h}%`, borderRadius:'2px 2px 0 0', background:i>=5?'var(--green)':i>=3?'var(--blue)':'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
        <span style={{ fontSize:7, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>BTC/USDT</span>
        <span style={{ fontSize:7, color:'var(--green)', fontFamily:'var(--font-mono)' }}>↑ $103,420</span>
      </div>
    </div>
  )
}

function PreviewAgent() {
  return (
    <div style={pBase}>
      {[['IF BTC > $105k','BUY','var(--green)'],['IF RSI > 80','ALERT','var(--blue)'],['DAILY 9AM','REPORT','#8b5cf6']].map(([cond,act,col]) => (
        <div key={cond as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)', borderRadius:4, padding:'3px 5px', marginBottom:3 }}>
          <span style={{ fontSize:7, color:'var(--text3)' }}>{cond}</span>
          <span style={{ fontSize:6, padding:'1px 5px', borderRadius:3, background:'rgba(0,0,0,0.3)', color:col as string, border:`1px solid ${col}33`, fontFamily:'var(--font-mono)' }}>{act}</span>
        </div>
      ))}
    </div>
  )
}

const FEAT_COLS = [
  [{ id:'chat',      icon:'🤖', name:'AI Chat',    sub:'Live LBank answers',       Preview:PreviewChat      },
   { id:'markets',   icon:'📈', name:'Markets',     sub:'Real-time prices',         Preview:PreviewMarkets   }],
  [{ id:'portfolio', icon:'💼', name:'Portfolio',   sub:'Holdings & PnL',           Preview:PreviewPortfolio },
   { id:'trading',   icon:'⚡', name:'Trade',       sub:'Buy & sell on LBank',      Preview:PreviewTrade     }],
  [{ id:'alerts',    icon:'🔔', name:'Alerts',      sub:'Price notifications',      Preview:PreviewAlerts    },
   { id:'agent',     icon:'🎯', name:'Auto Agent',  sub:'Rules that trade for you', Preview:PreviewAgent     }],
]

function useScroll(ref: React.RefObject<HTMLDivElement>, colW: number) {
  useEffect(() => {
    const track = ref.current
    if (!track) return
    const orig = track.innerHTML
    track.innerHTML = orig + orig + orig
    const total = (track.children.length / 3) * colW
    let offset = 0, paused = false, dragging = false, startX = 0, startOff = 0, raf: number

    const tick = () => {
      if (!paused && !dragging) {
        offset += 0.35
        if (offset > total) offset -= total
        track.style.transform = `translateX(${-offset}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const wrap = track.parentElement!
    const stop = () => { paused = true }
    const go   = () => { paused = false }
    const down = (e: MouseEvent) => { dragging = true; paused = true; startX = e.clientX; startOff = offset; e.preventDefault() }
    const move = (e: MouseEvent) => { if (!dragging) return; offset = startOff+(startX-e.clientX); if(offset>total*2)offset-=total; if(offset<0)offset+=total; track.style.transform=`translateX(${-offset}px)` }
    const up   = () => { if (dragging) { dragging = false; paused = false } }
    const ts   = (e: TouchEvent) => { dragging = true; paused = true; startX = e.touches[0].clientX; startOff = offset }
    const tm   = (e: TouchEvent) => { if (!dragging) return; offset = startOff+(startX-e.touches[0].clientX); if(offset>total*2)offset-=total; if(offset<0)offset+=total; track.style.transform=`translateX(${-offset}px)` }
    const te   = () => { dragging = false; paused = false }

    wrap.addEventListener('mouseenter',stop); wrap.addEventListener('mouseleave',go)
    wrap.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up)
    wrap.addEventListener('touchstart',ts,{passive:true}); wrap.addEventListener('touchmove',tm,{passive:true}); wrap.addEventListener('touchend',te)

    return () => {
      cancelAnimationFrame(raf)
      wrap.removeEventListener('mouseenter',stop); wrap.removeEventListener('mouseleave',go)
      wrap.removeEventListener('mousedown',down); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up)
      wrap.removeEventListener('touchstart',ts); wrap.removeEventListener('touchmove',tm); wrap.removeEventListener('touchend',te)
    }
  }, [])
}

export default function DashboardTab() {
  const { setActiveTab } = useStore()
  const { data: session } = useSession()
  const name  = session?.user?.name?.split(' ')[0] ?? 'there'
  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const navRef  = useRef<HTMLDivElement>(null)
  const featRef = useRef<HTMLDivElement>(null)

  useScroll(navRef,  116)
  useScroll(featRef, 116)

  const wrap: React.CSSProperties     = { overflow:'hidden', cursor:'grab', userSelect:'none' }
  const track: React.CSSProperties    = { display:'flex', gap:8, width:'max-content' }
  const col: React.CSSProperties      = { display:'flex', flexDirection:'column', gap:8 }
  const navCard: React.CSSProperties  = { width:108, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'12px 8px', borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border)', cursor:'pointer', textAlign:'center' }
  const featCard: React.CSSProperties = { width:108, borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border)', cursor:'pointer', overflow:'hidden', textAlign:'left', padding:0 }

  const Divider = ({ label }: { label: string }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0 12px' }}>
      <div style={{ flex:1, height:1, background:'var(--border)' }} />
      <span style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }} />
    </div>
  )

  return (
    <div style={{ minHeight:'100%', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <LiveTickerStrip />

      <div style={{ padding:'18px 18px 40px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:11, color:'#fff', flexShrink:0 }}>LB</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text3)', fontFamily:'var(--font-mono)' }}>LBrain</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:1, fontWeight:400 }}>{greet}, {name}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, background:'rgba(0,192,135,0.07)', border:'1px solid rgba(0,192,135,0.15)', fontSize:9, color:'var(--green)', fontFamily:'var(--font-mono)' }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--green)', animation:'lbP 2s infinite' }} />
            Live
          </div>
        </div>

        {/* Description */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', marginBottom:4 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:4, letterSpacing:'-0.01em' }}>The AI brain for LBank</div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.6, fontWeight:400 }}>
            Trade smarter with <span style={{ color:'var(--blue)' }}>live market data</span>, AI analysis, and automated rules — all in one place.
          </div>
        </div>

        {/* Navigate */}
        <div style={{ maxWidth:360, margin:'0 auto' }}>
          <Divider label="Navigate" />
          <div style={wrap}>
            <div ref={navRef} style={track}>
              {NAV_COLS.map((pair, ci) => (
                <div key={ci} style={col}>
                  {pair.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as ActiveTab)} style={navCard}
                      onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--blue)'; el.style.background='var(--bg3)' }}
                      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--border)'; el.style.background='var(--bg2)' }}>
                      <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text2)' }}>{item.label}</div>
                      <div style={{ fontSize:8, color:'var(--text3)', fontWeight:400 }}>{item.desc}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ maxWidth:360, margin:'0 auto' }}>
          <Divider label="Features" />
          <div style={wrap}>
            <div ref={featRef} style={track}>
              {FEAT_COLS.map((pair, ci) => (
                <div key={ci} style={col}>
                  {pair.map(({ id, icon, name:fn, sub, Preview }) => (
                    <button key={id} onClick={() => setActiveTab(id as ActiveTab)} style={featCard}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--blue)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
                      <Preview />
                      <div style={{ padding:'6px 8px' }}>
                        <div style={{ fontSize:9, fontWeight:500, color:'var(--text)' }}>{icon} {fn}</div>
                        <div style={{ fontSize:8, color:'var(--text3)', marginTop:1, fontWeight:400 }}>{sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop:22, paddingTop:14, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
          LBrain · LBank Skills · Kimi K2
        </div>
      </div>
      <style>{`@keyframes lbP{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
