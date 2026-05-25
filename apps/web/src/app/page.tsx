'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'
import Sidebar      from '@/components/Sidebar'
import BottomNav    from '@/components/BottomNav'
import DashboardTab from '@/components/tabs/DashboardTab'
import ChatTab      from '@/components/tabs/ChatTab'
import MarketsTab   from '@/components/tabs/MarketsTab'
import PortfolioTab from '@/components/tabs/PortfolioTab'
import TradingTab   from '@/components/tabs/TradingTab'
import AlertsTab    from '@/components/tabs/AlertsTab'
import AgentTab     from '@/components/tabs/AgentTab'
import LearnTab     from '@/components/tabs/LearnTab'
import SettingsTab  from '@/components/tabs/SettingsTab'

const TABS: Record<string, React.ReactNode> = {
  home:      <DashboardTab />,
  chat:      <ChatTab />,
  markets:   <MarketsTab />,
  portfolio: <PortfolioTab />,
  trading:   <TradingTab />,
  alerts:    <AlertsTab />,
  agent:     <AgentTab />,
  learn:     <LearnTab />,
  settings:  <SettingsTab />,
}

export default function App() {
  const { data: session }         = useSession()
  const { activeTab, setActiveTab } = useStore()
  const [drawer, setDrawer]       = useState(false)
  const isHome = activeTab === 'home'

  // Always land on dashboard after login
  useEffect(() => {
    if (session) setActiveTab('home')
  }, [session?.user?.email])

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {!isHome && (
            <div className="flex items-center px-6 h-14 border-b shrink-0"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <span className="font-bold text-sm capitalize" style={{ color: 'var(--text)' }}>{activeTab}</span>
            </div>
          )}
          <main className="flex-1 overflow-y-auto">{TABS[activeTab]}</main>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex md:hidden flex-col" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        {!isHome && (
          <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b"
            style={{ background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)', position: 'sticky', top: 0, zIndex: 30 }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs"
                style={{ background: 'var(--blue)', color: '#fff' }}>LB</div>
              <span className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>LBrain</span>
            </div>
            <button onClick={() => setDrawer(!drawer)}
              className="flex flex-col items-center justify-center gap-1 w-9 h-9 rounded-lg"
              style={{ background: 'var(--bg3)' }}>
              {[16, 16, 10].map((w, i) => (
                <span key={i} style={{ width: w, height: 1.5, background: 'var(--text2)', borderRadius: 1, display: 'block' }} />
              ))}
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 68 }}>
          {TABS[activeTab]}
        </main>
        <BottomNav />
      </div>
    </>
  )
}
