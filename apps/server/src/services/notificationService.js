/**
 * apps/server/src/services/notificationService.ts
 * Pushes alert/agent events back to the web app via webhook.
 * The web app can then forward to Telegram or store in Supabase.
 */
import axios from 'axios';
const WEB_APP_URL = process.env.WEB_APP_URL ?? '';
const SERVER_SECRET = process.env.SERVER_SECRET ?? '';
const OPENCLAW_SECRET = process.env.OPENCLAW_SECRET ?? '';
class NotificationService {
    constructor() {
        this.queue = [];
        this.flushing = false;
    }
    async sendAlertTrigger(trigger) {
        const payload = {
            type: 'alert_triggered',
            userId: trigger.userId,
            data: trigger,
            message: `🔔 *${trigger.symbol} Alert Triggered*\n${trigger.symbol} is ${trigger.condition} $${trigger.target.toLocaleString()}\nCurrent price: $${trigger.price.toLocaleString()}\n${trigger.note ? `\n_${trigger.note}_` : ''}\n\n_via LBrain Server_`,
        };
        this.queue.push(payload);
        await this.flush();
    }
    async sendAgentExecution(exec) {
        const payload = {
            type: 'agent_executed',
            userId: exec.userId,
            data: exec,
            message: `🤖 *Agent Rule: ${exec.ruleName}*\n${exec.result}\n${exec.symbol} @ $${exec.price.toLocaleString()}\n\n_via LBrain Server_`,
        };
        this.queue.push(payload);
        await this.flush();
    }
    async flush() {
        if (this.flushing || !this.queue.length || !WEB_APP_URL)
            return;
        this.flushing = true;
        while (this.queue.length > 0) {
            const payload = this.queue.shift();
            try {
                await axios.post(`${WEB_APP_URL}/api/agent/notify`, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-server-secret': SERVER_SECRET,
                    },
                    timeout: 10000,
                });
            }
            catch (err) {
                console.error('[NotificationService] Failed to send:', err.message);
            }
        }
        this.flushing = false;
    }
    // Send a message to Telegram via OpenClaw
    async sendTelegramMessage(chatId, message) {
        if (!WEB_APP_URL || !OPENCLAW_SECRET)
            return;
        try {
            await axios.post(`${WEB_APP_URL}/api/openclaw/message`, { message, channel: 'telegram', sender: 'lbrain-server', chatId }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-openclaw-token': OPENCLAW_SECRET,
                },
                timeout: 10000,
            });
        }
        catch (err) {
            console.error('[NotificationService] Telegram failed:', err.message);
        }
    }
}
export const notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map