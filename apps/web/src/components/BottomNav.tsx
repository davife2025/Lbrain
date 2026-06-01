'use client'

import { useStore } from '@/lib/store'
import type { ActiveTab } from '@/lib/store'

const ITEMS: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'home',      icon: '▦',  label: 'Home'     },
  { id: 'markets',   icon: '╱╲', label: 'Markets'  },
  { id: 'chat',      icon: '⬡',  label: 'AI'       },
  { id: 'trading',   icon: '⇅',  label: 'Trade'    },
  { id: 'settings',  icon: '⊘',  label: 'Settings' },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-center border-t z-40"
      style={{ background:'rgba(9,9,15,0.96)', backdropFilter:'blur(16px)', borderColor:'var(--border)', height:60 }}>
      {ITEMS.map(item => {
        const active = activeTab === item.id
        return (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative"
            style={{ color: active ? 'var(--blue)' : 'var(--text3)', transition:'color 0.15s' }}>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ background:'var(--blue)' }} />
            )}
            <span style={{ fontSize:15, opacity: active ? 1 : 0.5, fontFamily:'var(--font-mono)', transition:'opacity 0.15s' }}>
              {item.icon}
            </span>
            <span style={{ fontSize:9, fontWeight: active ? 500 : 400, fontFamily:'var(--font-sans)', letterSpacing:'0.02em' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
