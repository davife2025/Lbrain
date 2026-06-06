/**
 * apps/web/src/lib/alertEngine.ts
 * Client-side alert polling engine.
 * Checks live prices every 30s and fires browser notifications when triggered.
 */
export interface Alert {
    id: string;
    symbol: string;
    condition: 'above' | 'below';
    target: number;
    note: string;
    active: boolean;
    createdAt: string;
    triggered?: boolean;
}
type AlertCallback = (alert: Alert, price: number) => void;
declare class AlertEngine {
    private timer;
    private callbacks;
    private fired;
    start(intervalMs?: number): void;
    stop(): void;
    onTrigger(cb: AlertCallback): () => void;
    private check;
    private notify;
    requestPermission(): void;
}
export declare const alertEngine: AlertEngine;
export {};
//# sourceMappingURL=alertEngine.d.ts.map