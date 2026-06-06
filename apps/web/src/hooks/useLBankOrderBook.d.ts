export interface OrderBookEntry {
    price: number;
    amount: number;
    total: number;
}
export interface LiveOrderBook {
    symbol: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    spread: number;
    midPrice: number;
}
export declare function useLBankOrderBook(symbol: string, depth?: number): {
    book: LiveOrderBook | null;
    status: "connecting" | "connected" | "disconnected";
};
//# sourceMappingURL=useLBankOrderBook.d.ts.map