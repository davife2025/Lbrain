'use client';
import { useStore } from '@/lib/store';
const NAV_MAIN = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'chat', label: 'AI Assistant', icon: '🤖' },
    { id: 'markets', label: 'Markets', icon: '📈' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'trading', label: 'Trade', icon: '⚡' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'agent', label: 'Agent', icon: '🎯', badge: 'AUTO' },
    { id: 'learn', label: 'Learn', icon: '📚' },
    { id: 'messaging', label: 'Messaging', icon: '💬', badge: 'NEW' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];
export default function Sidebar() {
    const { activeTab, setActiveTab, isConnected, autoTradeEnabled } = useStore();
    return (<>
      <style>{`
        .lb-sb { width:52px; transition:width 0.2s cubic-bezier(0.4,0,0.2,1); overflow:hidden; white-space:nowrap; }
        .lb-sb:hover { width:196px; }
        .lb-lbl { opacity:0; transition:opacity 0.1s 0.05s; font-size:12px; font-weight:400; color:var(--text2); flex:1; font-family:var(--font-sans); }
        .lb-sb:hover .lb-lbl { opacity:1; }
        .lb-fade { opacity:0; transition:opacity 0.1s 0.06s; }
        .lb-sb:hover .lb-fade { opacity:1; }
        .lb-bdg { opacity:0; transition:opacity 0.1s; }
        .lb-sb:hover .lb-bdg { opacity:1; }
        .lb-item { position:relative; display:flex; align-items:center; gap:12px; padding:8px 14px; cursor:pointer; width:100%; border:none; background:transparent; text-align:left; transition:background 0.1s; }
        .lb-item:hover { background:var(--bg3); }
        .lb-item.active { background:var(--blue-subtle); }
        .lb-item.active::before { content:''; position:absolute; left:0; top:6px; bottom:6px; width:2px; background:var(--blue); border-radius:0 2px 2px 0; }
        .lb-item.active .lb-lbl { color:var(--blue); font-weight:500; }
        .lb-item .lb-icn { opacity:0.6; transition:opacity 0.1s; line-height:1; }
        .lb-item:hover .lb-icn { opacity:0.85; }
        .lb-item.active .lb-icn { opacity:1; }
        @keyframes lbBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <aside className="lb-sb flex flex-col shrink-0 border-r" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', height: '100vh' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-[13px] py-[14px] border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>LB</div>
          <div className="lb-fade">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>LBrain</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>AI Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 flex flex-col overflow-y-auto" style={{ gap: 1 }}>
          {NAV_MAIN.map(item => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`lb-item ${activeTab === item.id ? 'active' : ''}`}>
              <span className="lb-icn shrink-0" style={{ fontSize: 16, width: 24, textAlign: 'center' }}>
                {item.icon}
              </span>
              <span className="lb-lbl">{item.label}</span>
              {item.badge && (<span className="lb-bdg" style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {item.badge}
                </span>)}
            </button>))}
        </nav>

        {/* Bottom */}
        <div className="border-t shrink-0 py-2" style={{ borderColor: 'var(--border)' }}>
          {autoTradeEnabled && (<div className="flex items-center gap-2 mx-2 mb-1 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(240,79,90,0.06)', border: '1px solid rgba(240,79,90,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)', animation: 'lbBlink 1.5s infinite' }}/>
              <span className="lb-fade" style={{ fontSize: 9, color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>AUTO-TRADE ON</span>
            </div>)}
          <div className="flex items-center gap-3 px-[14px] py-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isConnected ? 'var(--green)' : 'var(--text3)', animation: isConnected ? 'lbBlink 2s infinite' : 'none' }}/>
            <span className="lb-fade" style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {isConnected ? 'LBank connected' : 'No API key'}
            </span>
          </div>
        </div>
      </aside>
    </>);
}
//# sourceMappingURL=Sidebar.js.map