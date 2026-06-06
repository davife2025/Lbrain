'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store';
import { useEngines } from '@/hooks/useEngines';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import NotificationBell from '@/components/NotificationBell';
import DashboardTab from '@/components/tabs/DashboardTab';
import ChatTab from '@/components/tabs/ChatTab';
import MarketsTab from '@/components/tabs/MarketsTab';
import PortfolioTab from '@/components/tabs/PortfolioTab';
import TradingTab from '@/components/tabs/TradingTab';
import AlertsTab from '@/components/tabs/AlertsTab';
import AgentTab from '@/components/tabs/AgentTab';
import LearnTab from '@/components/tabs/LearnTab';
import MessagingTab from '@/components/tabs/MessagingTab';
import SettingsTab from '@/components/tabs/SettingsTab';
const TABS = {
    home: <DashboardTab />,
    chat: <ChatTab />,
    markets: <MarketsTab />,
    portfolio: <PortfolioTab />,
    trading: <TradingTab />,
    alerts: <AlertsTab />,
    agent: <AgentTab />,
    learn: <LearnTab />,
    messaging: <MessagingTab />,
    settings: <SettingsTab />,
};
const TAB_LABELS = {
    chat: 'AI Assistant', markets: 'Markets', portfolio: 'Portfolio',
    trading: 'Trade', alerts: 'Alerts', agent: 'Agent', learn: 'Learn',
    messaging: 'Messaging', settings: 'Settings',
};
export default function App() {
    const { data: session } = useSession();
    const { activeTab, setActiveTab } = useStore();
    const { notifications, unreadCount, markAllRead, clearNotifications } = useEngines();
    const isHome = activeTab === 'home';
    // Always land on dashboard after login
    useEffect(() => {
        if (session)
            setActiveTab('home');
    }, [session?.user?.email]);
    return (<>
      {/* ── Desktop ── */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {!isHome && (<div className="flex items-center justify-between px-6 h-14 border-b shrink-0" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {TAB_LABELS[activeTab] ?? activeTab}
              </span>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} onMarkRead={markAllRead} onClear={clearNotifications}/>
            </div>)}
          <main className="flex-1 overflow-y-auto">{TABS[activeTab]}</main>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex md:hidden flex-col" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        {!isHome && (<div className="flex items-center justify-between px-4 h-14 shrink-0 border-b" style={{ background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)', position: 'sticky', top: 0, zIndex: 30 }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs" style={{ background: 'var(--blue)', color: '#fff' }}>LB</div>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {TAB_LABELS[activeTab] ?? 'LBrain'}
              </span>
            </div>
            <NotificationBell notifications={notifications} unreadCount={unreadCount} onMarkRead={markAllRead} onClear={clearNotifications}/>
          </div>)}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 68 }}>
          {TABS[activeTab]}
        </main>
        <BottomNav />
      </div>
    </>);
}
//# sourceMappingURL=page.js.map