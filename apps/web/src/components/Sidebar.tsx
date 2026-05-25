'use client'

import { useStore } from '@/lib/store'
import type { ActiveTab } from '@/lib/store'

const NAV_MAIN: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'home',      label: 'Dashboard',    icon: '⊞' },
  { id: 'chat',      label: 'AI Assistant', icon: '◈' },
  { id: 'markets',   label: 'Markets',      icon: '◐' },
  { id: 'portfolio', label: 'Portfolio',    icon: '◑' },
  { id: 'trading',   label: 'Trade',        icon: '⚡' },
  { id: 'alerts',    label: 'Alerts',       icon: '🔔' },
  { id: 'agent',     label: 'Agent',        icon: '🤖' },
  { id: 'learn',     label: 'Learn',        icon: '◉' },
]

export default function Sidebar() {
  const { activeTab, setActiveTab, isConnected, autoTradeEnabled } = useStore()

  return (
    <>
      <style>{`
        .lb-sidebar { width:52px; transition:width 0.22s cubic-bezier(0.4,0,0.2,1); overflow:hidden; white-space:nowrap; }
        .lb-sidebar:hover { width:188px; }
        .lb-label { opacity:0; transition:opacity 0.12s 0.06s; font-size:12px; font-weight:600; color:var(--text2); flex:1; }
        .lb-sidebar:hover .lb-label { opacity:1; }
        .lb-fade { opacity:0; transition:opacity 0.12s 0.08s; }
        .lb-sidebar:hover .lb-fade { opacity:1; }
        .lb-item { position:relative; display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer; width:100%; border:none; background:transparent; text-align:left; transition:background 0.12s; }
        .lb-item:hover { background:var(--bg3); }
        .lb-item.active { background:var(--blue-subtle); }
        .lb-item.active::before { content:''; position:absolute; left:0; top:5px; bottom:5px; width:2px; background:var(--blue); border-radius:0 2px 2px 0; }
        .lb-item.active .lb-label { color:var(--blue); }
        .lb-item .lb-icon { opacity:0.6; }
        .lb-item.active .lb-icon { opacity:1; }
        @keyframes lbBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <aside className="lb-sidebar flex flex-col shrink-0 border-r"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)', height: '100vh' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-[13px] py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center font-black shrink-0"
            style={{ background: 'var(--blue)', color: '#fff', fontSize: 10 }}>LB</div>
          <div className="lb-fade">
            <div className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>LBrain</div>
            <div className="mono text-[8px] tracking-widest uppercase" style={{ color: 'var(--text3)' }}>AI Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 flex flex-col overflow-y-auto" style={{ gap: 1 }}>
          {NAV_MAIN.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`lb-item ${activeTab === item.id ? 'active' : ''}`}>
              <span className="lb-icon text-center shrink-0" style={{ fontSize: 15, width: 24 }}>{item.icon}</span>
              <span className="lb-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t shrink-0" style={{ borderColor: 'var(--border)', padding: '8px 0' }}>
          {autoTradeEnabled && (
            <div className="flex items-center gap-2 mx-2 mb-1 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(240,79,90,0.08)', border: '1px solid rgba(240,79,90,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--red)', animation: 'lbBlink 1.5s infinite' }} />
              <span className="lb-fade mono font-bold text-[9px]" style={{ color: 'var(--red)' }}>AUTO-TRADE ON</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-[14px] py-2">
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: isConnected ? 'var(--green)' : 'var(--text3)', animation: isConnected ? 'lbBlink 2s infinite' : 'none' }} />
            <span className="lb-fade mono text-[10px]" style={{ color: 'var(--text3)' }}>
              {isConnected ? 'LBank connected' : 'No API key'}
            </span>
          </div>
          <button onClick={() => setActiveTab('settings')}
            className={`lb-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <span className="lb-icon text-center shrink-0" style={{ fontSize: 15, width: 24 }}>⚙</span>
            <span className="lb-label">Settings</span>
          </button>
        </div>
      </aside>
    </>
  )
}
