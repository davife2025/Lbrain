/**
 * apps/web/src/lib/agentEngine.ts
 * Client-side agent rule execution engine.
 * Evaluates IF/THEN rules against live prices and executes actions.
 */
'use client';
class AgentEngine {
    constructor() {
        this.timer = null;
        this.callbacks = [];
        this.apiKey = '';
        this.apiSecret = '';
        this.autoTrade = false;
    }
    configure(apiKey, apiSecret, autoTrade) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.autoTrade = autoTrade;
    }
    start(intervalMs = 60000) {
        if (this.timer)
            return;
        this.run();
        this.timer = setInterval(() => this.run(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    onLog(cb) {
        this.callbacks.push(cb);
        return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
    }
    async run() {
        let rules = [];
        try {
            const saved = localStorage.getItem('lbrain-rules');
            if (saved)
                rules = JSON.parse(saved);
        }
        catch {
            return;
        }
        const active = rules.filter(r => r.active);
        if (!active.length)
            return;
        for (const rule of active) {
            try {
                await this.evaluate(rule);
            }
            catch { }
        }
    }
    async evaluate(rule) {
        // Check cooldown — don't re-run a rule within 5 minutes
        if (rule.lastRun) {
            const lastRun = new Date(rule.lastRun).getTime();
            if (Date.now() - lastRun < 5 * 60 * 1000)
                return;
        }
        // Get current price
        const sym = `${rule.symbol.toLowerCase()}_usdt`;
        const res = await fetch(`/api/lbank/market?skill=ticker&symbol=${sym}`);
        const json = await res.json();
        if (!json.success)
            return;
        const price = json.data.price;
        // Evaluate trigger
        const triggered = this.checkTrigger(rule.trigger, rule.triggerValue, price);
        if (!triggered)
            return;
        // Execute action
        const result = await this.executeAction(rule, price);
        // Update lastRun in localStorage
        this.updateRuleLastRun(rule.id);
        // Fire log callback
        const log = {
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action,
            symbol: rule.symbol,
            price,
            result: result.message,
            success: result.success,
            timestamp: new Date().toISOString(),
        };
        this.callbacks.forEach(cb => cb(log));
        // Store log
        this.storeLog(log);
    }
    checkTrigger(trigger, value, price) {
        switch (trigger) {
            case 'price_above': return price >= value;
            case 'price_below': return price <= value;
            case 'daily_time': {
                const now = new Date();
                const [h, m] = String(value).split('.').map(Number);
                return now.getHours() === (h ?? 0) && now.getMinutes() < 5;
            }
            // RSI would require kline data — stub as false for now
            case 'rsi_above':
            case 'rsi_below':
                return false;
            default:
                return false;
        }
    }
    async executeAction(rule, price) {
        switch (rule.action) {
            case 'send_alert': {
                const msg = `🤖 Agent Rule "${rule.name}" triggered!\n${rule.symbol} @ $${price.toLocaleString()}`;
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('LBrain Agent', { body: msg, icon: '/favicon.ico' });
                }
                return { success: true, message: `Alert sent: ${msg}` };
            }
            case 'buy_market': {
                if (!this.autoTrade || !this.apiKey) {
                    return { success: false, message: 'Auto-trade disabled or no API key' };
                }
                const res = await fetch('/api/lbank/trading', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-lbank-key': this.apiKey, 'x-lbank-secret': this.apiSecret },
                    body: JSON.stringify({ action: 'place_order', symbol: `${rule.symbol.toLowerCase()}_usdt`, side: 'buy', type: 'market', amount: 0.001 }),
                });
                const json = await res.json();
                return json.data ?? { success: false, message: json.error };
            }
            case 'sell_market': {
                if (!this.autoTrade || !this.apiKey) {
                    return { success: false, message: 'Auto-trade disabled or no API key' };
                }
                const res = await fetch('/api/lbank/trading', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-lbank-key': this.apiKey, 'x-lbank-secret': this.apiSecret },
                    body: JSON.stringify({ action: 'place_order', symbol: `${rule.symbol.toLowerCase()}_usdt`, side: 'sell', type: 'market', amount: 0.001 }),
                });
                const json = await res.json();
                return json.data ?? { success: false, message: json.error };
            }
            case 'cancel_all': {
                if (!this.autoTrade || !this.apiKey) {
                    return { success: false, message: 'Auto-trade disabled or no API key' };
                }
                const res = await fetch('/api/lbank/trading', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-lbank-key': this.apiKey, 'x-lbank-secret': this.apiSecret },
                    body: JSON.stringify({ action: 'cancel_all', symbol: `${rule.symbol.toLowerCase()}_usdt` }),
                });
                const json = await res.json();
                return json.data ?? { success: false, message: json.error };
            }
            case 'post_report':
                return { success: true, message: `Report posted for ${rule.symbol} @ $${price.toLocaleString()}` };
            default:
                return { success: false, message: `Unknown action: ${rule.action}` };
        }
    }
    updateRuleLastRun(id) {
        try {
            const saved = localStorage.getItem('lbrain-rules');
            if (!saved)
                return;
            const rules = JSON.parse(saved);
            const updated = rules.map(r => r.id === id ? { ...r, lastRun: new Date().toISOString() } : r);
            localStorage.setItem('lbrain-rules', JSON.stringify(updated));
        }
        catch { }
    }
    storeLog(log) {
        try {
            const saved = localStorage.getItem('lbrain-agent-logs');
            const logs = saved ? JSON.parse(saved) : [];
            logs.unshift(log);
            localStorage.setItem('lbrain-agent-logs', JSON.stringify(logs.slice(0, 100)));
        }
        catch { }
    }
    getLogs() {
        try {
            const saved = localStorage.getItem('lbrain-agent-logs');
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    }
    clearLogs() {
        localStorage.removeItem('lbrain-agent-logs');
    }
}
export const agentEngine = new AgentEngine();
//# sourceMappingURL=agentEngine.js.map