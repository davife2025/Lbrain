/**
 * apps/server/src/cron.ts
 * Scheduled cron jobs running on Render 24/7.
 */
import cron from 'node-cron';
import { priceService } from './services/priceService';
const TOP_SYMBOLS = [
    'btc_usdt', 'eth_usdt', 'ltc_usdt', 'xrp_usdt',
    'bnb_usdt', 'sol_usdt', 'doge_usdt', 'ada_usdt',
    'dot_usdt', 'link_usdt', 'matic_usdt', 'avax_usdt',
];
export function startCrons() {
    // ── Warm up price cache every 15s ──────────────────────────────────────
    cron.schedule('*/15 * * * * *', async () => {
        try {
            await priceService.getMultiplePrices(TOP_SYMBOLS);
        }
        catch { }
    });
    // ── Log server stats every 5 mins ──────────────────────────────────────
    cron.schedule('*/5 * * * *', () => {
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        console.log(`[Cron] Uptime: ${Math.floor(process.uptime())}s · Memory: ${mem}MB`);
    });
    // ── Clear price cache every hour ───────────────────────────────────────
    cron.schedule('0 * * * *', () => {
        priceService.clearCache();
        console.log('[Cron] Price cache cleared');
    });
    console.log('[Cron] All jobs scheduled');
}
//# sourceMappingURL=cron.js.map