/**
 * apps/web/src/lib/alertEngine.ts
 * Client-side alert polling engine.
 * Checks live prices every 30s and fires browser notifications when triggered.
 */
'use client';
class AlertEngine {
    constructor() {
        this.timer = null;
        this.callbacks = [];
        this.fired = new Set(); // track already-fired alerts this session
    }
    start(intervalMs = 30000) {
        if (this.timer)
            return;
        this.check();
        this.timer = setInterval(() => this.check(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    onTrigger(cb) {
        this.callbacks.push(cb);
        return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
    }
    async check() {
        let alerts = [];
        try {
            const saved = localStorage.getItem('lbrain-alerts');
            if (saved)
                alerts = JSON.parse(saved);
        }
        catch {
            return;
        }
        const active = alerts.filter(a => a.active && !this.fired.has(a.id));
        if (!active.length)
            return;
        const symbols = [...new Set(active.map(a => `${a.symbol.toLowerCase()}_usdt`))];
        await Promise.allSettled(symbols.map(async (sym) => {
            try {
                const res = await fetch(`/api/lbank/market?skill=ticker&symbol=${sym}`);
                const json = await res.json();
                if (!json.success)
                    return;
                const price = json.data.price;
                const coin = sym.replace('_usdt', '').toUpperCase();
                const toFire = active.filter(a => a.symbol === coin &&
                    (a.condition === 'above' ? price >= a.target : price <= a.target));
                for (const alert of toFire) {
                    this.fired.add(alert.id);
                    this.notify(alert, price);
                    this.callbacks.forEach(cb => cb(alert, price));
                }
            }
            catch { }
        }));
    }
    notify(alert, price) {
        const title = `🔔 LBrain Alert — ${alert.symbol}`;
        const body = `${alert.symbol} is ${alert.condition} $${alert.target.toLocaleString()} — Current: $${price.toLocaleString()}\n${alert.note || ''}`;
        // Browser notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/favicon.ico' });
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted')
                        new Notification(title, { body, icon: '/favicon.ico' });
                });
            }
        }
        // Console log as fallback
        console.log(`[LBrain Alert] ${title}: ${body}`);
    }
    requestPermission() {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}
export const alertEngine = new AlertEngine();
//# sourceMappingURL=alertEngine.js.map