/**
 * apps/server/src/index.ts
 * LBrain Server — Express + engines running 24/7 on Render.
 *
 * Responsibilities:
 * - Alert price polling (every 30s)
 * - Agent rule execution (every 60s)
 * - REST API for web app to register/remove alerts and rules
 * - Price cache warming
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { startCrons } from './cron';
import { serverAlertEngine } from './services/alertEngine';
import { serverAgentEngine } from './services/agentEngine';
import { notificationService } from './services/notificationService';
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const app = express();
// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
    origin: [
        process.env.WEB_APP_URL ?? 'http://localhost:3000',
        'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-server-secret'],
}));
app.use(express.json());
// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', routes);
// Root
app.get('/', (_req, res) => {
    res.json({ service: 'lbrain-server', status: 'running', version: '1.0.0' });
});
// ── Wire up notifications ──────────────────────────────────────────────────
// Alert triggered → notify web app
serverAlertEngine.onTrigger(async (trigger) => {
    console.log(`[Server] Alert triggered: ${trigger.symbol} ${trigger.condition} $${trigger.target}`);
    await notificationService.sendAlertTrigger(trigger);
});
// Agent rule executed → notify web app
serverAgentEngine.onExecution(async (exec) => {
    console.log(`[Server] Rule executed: ${exec.ruleName} → ${exec.result}`);
    await notificationService.sendAgentExecution(exec);
});
// ── Start engines ──────────────────────────────────────────────────────────
serverAlertEngine.start(30000); // check alerts every 30s
serverAgentEngine.start(60000); // check rules every 60s
startCrons();
// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║         LBrain Server v1.0.0         ║
║  The AI brain for LBank — 24/7       ║
╠══════════════════════════════════════╣
║  Port:    ${PORT}                       ║
║  Engines: Alert + Agent              ║
║  Web app: ${(process.env.WEB_APP_URL ?? 'not set').slice(0, 26).padEnd(26)} ║
╚══════════════════════════════════════╝
  `);
});
// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received — shutting down gracefully');
    serverAlertEngine.stop();
    serverAgentEngine.stop();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('[Server] SIGINT received — shutting down');
    serverAlertEngine.stop();
    serverAgentEngine.stop();
    process.exit(0);
});
process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled rejection:', reason);
});
//# sourceMappingURL=index.js.map