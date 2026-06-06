/**
 * apps/server/src/services/priceService.ts
 * Caches and fetches live LBank prices server-side.
 * Used by alert and agent engines.
 */
declare class PriceService {
    private cache;
    private TTL;
    getPrice(symbol: string): Promise<number>;
    getMultiplePrices(symbols: string[]): Promise<Record<string, number>>;
    getTopMoversServer(limit?: number): Promise<{
        gainers: import("@lbrain/lbank-skills").LBankTicker[];
        losers: import("@lbrain/lbank-skills").LBankTicker[];
    }>;
    clearCache(): void;
}
export declare const priceService: PriceService;
export {};
//# sourceMappingURL=priceService.d.ts.map