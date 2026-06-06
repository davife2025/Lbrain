export interface LiveTicker {
    symbol: string;
    price: number;
    high: number;
    low: number;
    volume: number;
    changePct: number;
    direction: 'up' | 'down' | 'flat';
}
type WsStatus = 'connecting' | 'connected' | 'disconnected';
export declare function useLBankTicker(symbols: string[]): {
    tickers: Record<string, LiveTicker>;
    status: WsStatus;
};
/**
 * Single symbol convenience hook
 */
export declare function useSingleTicker(symbol: string): {
    ticker: LiveTicker;
    status: WsStatus;
};
export {};
//# sourceMappingURL=useLBankTicker.d.ts.map