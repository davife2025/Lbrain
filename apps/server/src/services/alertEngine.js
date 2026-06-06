/**
 * apps/server/src/services/alertEngine.ts
 * Server-side alert engine — runs 24/7 on Render.
 * Polls LBank prices and notifies the web app when alerts trigger.
 */
import { priceService } from './priceService';
class ServerAlertEngine {
    constructor() {
        this.alerts = [];
        this.fired = new Set();
        this.timer = null;
        this.onFire = [];
    }
    load(alerts) {
        this.alerts = alerts;
        console.log(`[AlertEngine] Loaded ${alerts.length} alerts`);
    }
    addAlert(alert) {
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
        this.alerts.push(alert);
    }
    removeAlert(id) {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.fired.delete(id);
    }
    onTrigger(cb) {
        this.onFire.push(cb);
    }
    start(intervalMs = 30000) {
        if (this.timer)
            return;
        console.log(`[AlertEngine] Started — checking every ${intervalMs / 1000}s`);
        this.check();
        this.timer = setInterval(() => this.check(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async check() {
        const active = this.alerts.filter(a => a.active && !this.fired.has(a.id));
        if (!active.length)
            return;
        const symbols = [...new Set(active.map(a => `${a.symbol.toLowerCase()}_usdt`))];
        const prices = await priceService.getMultiplePrices(symbols);
        for (const alert of active) {
            const pair = `${alert.symbol.toLowerCase()}_usdt`;
            const price = prices[pair];
            if (!price)
                continue;
            const hit = alert.condition === 'above' ? price >= alert.target : price <= alert.target;
            if (!hit)
                continue;
            console.log(`[AlertEngine] TRIGGERED: ${alert.symbol} ${alert.condition} $${alert.target} (current: $${price})`);
            this.fired.add(alert.id);
            const trigger = {
                alertId: alert.id,
                userId: alert.userId,
                symbol: alert.symbol,
                price,
                target: alert.target,
                condition: alert.condition,
                note: alert.note,
                firedAt: new Date().toISOString(),
            };
            this.onFire.forEach(cb => cb(trigger));
        }
    }
    getAlerts() { return this.alerts; }
    getFired() { return [...this.fired]; }
    resetFired(id) { this.fired.delete(id); }
}
export const serverAlertEngine = new ServerAlertEngine();
//# sourceMappingURL=alertEngine.js.map