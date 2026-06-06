/**
 * apps/server/src/services/agentEngine.ts
 * Server-side agent rule engine — runs 24/7 on Render.
 * Evaluates IF/THEN rules and executes trading actions.
 */
export interface ServerRule {
    id: string;
    userId: string;
    name: string;
    symbol: string;
    trigger: string;
    triggerValue: number;
    action: string;
    active: boolean;
    lastRun: string | null;
    createdAt: string;
    apiKey?: string;
    apiSecret?: string;
}
export interface RuleExecution {
    ruleId: string;
    userId: string;
    ruleName: string;
    symbol: string;
    price: number;
    action: string;
    result: string;
    success: boolean;
    executedAt: string;
}
declare class ServerAgentEngine {
    private rules;
    private timer;
    private onExec;
    private cooldowns;
    private COOLDOWN;
    load(rules: ServerRule[]): void;
    addRule(rule: ServerRule): void;
    removeRule(id: string): void;
    onExecution(cb: (exec: RuleExecution) => void): void;
    start(intervalMs?: number): void;
    stop(): void;
    private run;
    private evaluate;
    private checkTrigger;
    private executeAction;
    getRules(): ServerRule[];
}
export declare const serverAgentEngine: ServerAgentEngine;
export {};
//# sourceMappingURL=agentEngine.d.ts.map