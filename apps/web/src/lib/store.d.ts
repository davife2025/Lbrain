export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolsUsed?: string[];
    timestamp: number;
}
export interface Holding {
    coin: string;
    qty: number;
    avgBuy: number;
    color: string;
}
export type ActiveTab = 'home' | 'chat' | 'markets' | 'portfolio' | 'trading' | 'alerts' | 'agent' | 'learn' | 'messaging' | 'settings';
interface LBrainStore {
    apiKey: string;
    apiSecret: string;
    isConnected: boolean;
    autoTradeEnabled: boolean;
    setCredentials: (key: string, secret: string) => void;
    clearCredentials: () => void;
    setAutoTrade: (enabled: boolean) => void;
    chatMessages: ChatMessage[];
    chatMode: 'assistant' | 'analyst' | 'trader' | 'educator';
    addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearChat: () => void;
    setChatMode: (mode: LBrainStore['chatMode']) => void;
    holdings: Holding[];
    addHolding: (h: Holding) => void;
    removeHolding: (coin: string) => void;
    clearHoldings: () => void;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}
export declare const useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<LBrainStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<LBrainStore, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: LBrainStore) => void) => () => void;
        onFinishHydration: (fn: (state: LBrainStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<LBrainStore, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=store.d.ts.map