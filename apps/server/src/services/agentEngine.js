/**
 * apps/server/src/services/agentEngine.ts
 * Server-side agent rule engine — runs 24/7 on Render.
 * Evaluates IF/THEN rules and executes trading actions.
 */
import { priceService } from './priceService';
import { LBankClient, placeOrder, cancelAllOrders } from '@lbrain/lbank-skills';
class ServerAgentEngine {
    constructor() {
        this.rules = [];
        this.timer = null;
        this.onExec = [];
        this.cooldowns = new Map(); // ruleId → last run ms
        this.COOLDOWN = 5 * 60 * 1000; // 5 min
    }
    load(rules) {
        this.rules = rules;
        console.log(`[AgentEngine] Loaded ${rules.length} rules`);
    }
    addRule(rule) {
        this.rules = this.rules.filter(r => r.id !== rule.id);
        this.rules.push(rule);
    }
    removeRule(id) {
        this.rules = this.rules.filter(r => r.id !== id);
        this.cooldowns.delete(id);
    }
    onExecution(cb) {
        this.onExec.push(cb);
    }
    start(intervalMs = 60000) {
        if (this.timer)
            return;
        console.log(`[AgentEngine] Started — checking every ${intervalMs / 1000}s`);
        this.run();
        this.timer = setInterval(() => this.run(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async run() {
        const active = this.rules.filter(r => r.active);
        if (!active.length)
            return;
        for (const rule of active) {
            // Check cooldown
            const lastRun = this.cooldowns.get(rule.id) ?? 0;
            if (Date.now() - lastRun < this.COOLDOWN)
                continue;
            try {
                await this.evaluate(rule);
            }
            catch (err) {
                console.error(`[AgentEngine] Rule ${rule.name} error:`, err.message);
            }
        }
    }
    async evaluate(rule) {
        const pair = `${rule.symbol.toLowerCase()}_usdt`;
        const price = await priceService.getPrice(pair);
        const triggered = this.checkTrigger(rule.trigger, rule.triggerValue, price);
        if (!triggered)
            return;
        console.log(`[AgentEngine] TRIGGERED: ${rule.name} — ${rule.symbol} @ $${price}`);
        const result = await this.executeAction(rule, price);
        // Set cooldown
        this.cooldowns.set(rule.id, Date.now());
        const exec = {
            ruleId: rule.id,
            userId: rule.userId,
            ruleName: rule.name,
            symbol: rule.symbol,
            price,
            action: rule.action,
            result: result.message,
            success: result.success,
            executedAt: new Date().toISOString(),
        };
        this.onExec.forEach(cb => cb(exec));
        console.log(`[AgentEngine] ${rule.name}: ${result.message}`);
    }
    checkTrigger(trigger, value, price) {
        switch (trigger) {
            case 'price_above': return price >= value;
            case 'price_below': return price <= value;
            case 'daily_time': {
                const now = new Date();
                return now.getHours() === Math.floor(value) && now.getMinutes() < 2;
            }
            default: return false;
        }
    }
    async executeAction(rule, price) {
        switch (rule.action) {
            case 'send_alert':
                return { success: true, message: `Alert: ${rule.symbol} @ $${price.toLocaleString()} — ${rule.name}` };
            case 'buy_market': {
                if (!rule.apiKey || !rule.apiSecret)
                    return { success: false, message: 'No API key configured' };
                const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret });
                return await placeOrder(client, {
                    symbol: `${rule.symbol.toLowerCase()}_usdt`,
                    side: 'buy',
                    type: 'market',
                    amount: 0.001,
                });
            }
            case 'sell_market': {
                if (!rule.apiKey || !rule.apiSecret)
                    return { success: false, message: 'No API key configured' };
                const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret });
                return await placeOrder(client, {
                    symbol: `${rule.symbol.toLowerCase()}_usdt`,
                    side: 'sell',
                    type: 'market',
                    amount: 0.001,
                });
            }
            case 'cancel_all': {
                if (!rule.apiKey || !rule.apiSecret)
                    return { success: false, message: 'No API key configured' };
                const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret });
                return await cancelAllOrders(client, `${rule.symbol.toLowerCase()}_usdt`);
            }
            case 'post_report':
                return { success: true, message: `Report: ${rule.symbol} @ $${price.toLocaleString()}` };
            default:
                return { success: false, message: `Unknown action: ${rule.action}` };
        }
    }
    getRules() { return this.rules; }
}
export const serverAgentEngine = new ServerAgentEngine();
//# sourceMappingURL=agentEngine.js.map