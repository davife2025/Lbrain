/**
 * apps/server/src/services/notificationService.ts
 * Pushes alert/agent events back to the web app via webhook.
 * The web app can then forward to Telegram or store in Supabase.
 */
import type { AlertTrigger } from './alertEngine';
import type { RuleExecution } from './agentEngine';
declare class NotificationService {
    private queue;
    private flushing;
    sendAlertTrigger(trigger: AlertTrigger): Promise<void>;
    sendAgentExecution(exec: RuleExecution): Promise<void>;
    private flush;
    sendTelegramMessage(chatId: string, message: string): Promise<void>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notificationService.d.ts.map