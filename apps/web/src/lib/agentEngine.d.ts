/**
 * apps/web/src/lib/agentEngine.ts
 * Client-side agent rule execution engine.
 * Evaluates IF/THEN rules against live prices and executes actions.
 */
export interface AgentRule {
    id: string;
    name: string;
    trigger: string;
    triggerValue: number;
    action: string;
    symbol: string;
    active: boolean;
    lastRun: string | null;
    createdAt: string;
}
export type AgentLog = {
    ruleId: string;
    ruleName: string;
    action: string;
    symbol: string;
    price: number;
    result: string;
    success: boolean;
    timestamp: string;
};
type LogCallback = (log: AgentLog) => void;
declare class AgentEngine {
    private timer;
    private callbacks;
    private apiKey;
    private apiSecret;
    private autoTrade;
    configure(apiKey: string, apiSecret: string, autoTrade: boolean): void;
    start(intervalMs?: number): void;
    stop(): void;
    onLog(cb: LogCallback): () => void;
    private run;
    private evaluate;
    private checkTrigger;
    private executeAction;
    private updateRuleLastRun;
    private storeLog;
    getLogs(): AgentLog[];
    clearLogs(): void;
}
export declare const agentEngine: AgentEngine;
export {};
//# sourceMappingURL=agentEngine.d.ts.map