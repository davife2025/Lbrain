import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ChatMessage {
  id:         string
  role:       'user' | 'assistant' | 'system'
  content:    string
  toolsUsed?: string[]
  timestamp:  number
}

export interface Holding {
  coin:   string
  qty:    number
  avgBuy: number
  color:  string
}

export type ActiveTab =
  | 'home' | 'chat' | 'markets' | 'portfolio'
  | 'trading' | 'alerts' | 'agent' | 'learn'
  | 'messaging' | 'settings'

interface LBrainStore {
  // Credentials
  apiKey:           string
  apiSecret:        string
  isConnected:      boolean
  autoTradeEnabled: boolean
  setCredentials:   (key: string, secret: string) => void
  clearCredentials: () => void
  setAutoTrade:     (enabled: boolean) => void

  // Chat
  chatMessages:   ChatMessage[]
  chatMode:       'assistant' | 'analyst' | 'trader' | 'educator'
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat:      () => void
  setChatMode:    (mode: LBrainStore['chatMode']) => void

  // Portfolio
  holdings:      Holding[]
  addHolding:    (h: Holding) => void
  removeHolding: (coin: string) => void
  clearHoldings: () => void

  // Settings
  activeTab:    ActiveTab
  setActiveTab: (tab: ActiveTab) => void
}

const COLORS = ['#1a6fff','#00c087','#f59e0b','#8b5cf6','#f04f5a','#06b6d4','#10b981']

export const useStore = create<LBrainStore>()(
  persist(
    (set, get) => ({
      // Credentials
      apiKey:           '',
      apiSecret:        '',
      isConnected:      false,
      autoTradeEnabled: false,
      setCredentials:   (key, secret) => set({ apiKey: key, apiSecret: secret, isConnected: !!(key && secret) }),
      clearCredentials: ()            => set({ apiKey: '', apiSecret: '', isConnected: false, autoTradeEnabled: false }),
      setAutoTrade:     (enabled)     => set({ autoTradeEnabled: enabled }),

      // Chat
      chatMessages: [],
      chatMode:     'assistant',
      addChatMessage: (msg) => set(s => ({
        chatMessages: [...s.chatMessages, { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }],
      })),
      clearChat:   () => set({ chatMessages: [] }),
      setChatMode: (mode) => set({ chatMode: mode }),

      // Portfolio
      holdings:      [],
      addHolding:    (h) => {
        const { holdings } = get()
        const color = COLORS[holdings.length % COLORS.length]
        set(s => ({ holdings: [...s.holdings, { ...h, color }] }))
      },
      removeHolding: (coin) => set(s => ({
        holdings: s.holdings
          .filter(h => h.coin !== coin)
          .map((h, i) => ({ ...h, color: COLORS[i % COLORS.length] })),
      })),
      clearHoldings: () => set({ holdings: [] }),

      // Settings
      activeTab:    'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name:    'lbrain-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chatMode:  state.chatMode,
        holdings:  state.holdings,
        activeTab: state.activeTab,
      }),
    }
  )
)
