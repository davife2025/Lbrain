/**
 * apps/server/src/services/alertEngine.ts
 * Server-side alert engine — runs 24/7 on Render.
 * Polls LBank prices and notifies the web app when alerts trigger.
 */
export interface ServerAlert {
    id: string;
    userId: string;
    symbol: string;
    condition: 'above' | 'below';
    target: number;
    note: string;
    active: boolean;
    createdAt: string;
}
export interface AlertTrigger {
    alertId: string;
    userId: string;
    symbol: string;
    price: number;
    target: number;
    condition: 'above' | 'below';
    note: string;
    firedAt: string;
}
declare class ServerAlertEngine {
    private alerts;
    private fired;
    private timer;
    private onFire;
    load(alerts: ServerAlert[]): void;
    addAlert(alert: ServerAlert): void;
    removeAlert(id: string): void;
    onTrigger(cb: (trigger: AlertTrigger) => void): void;
    start(intervalMs?: number): void;
    stop(): void;
    private check;
    getAlerts(): ServerAlert[];
    getFired(): string[];
    resetFired(id: string): void;
}
export declare const serverAlertEngine: ServerAlertEngine;
export {};
//# sourceMappingURL=alertEngine.d.ts.map