/**
 * apps/server/src/routes/index.ts
 * All Express API routes for the LBrain server.
 */

import { Router, Request, Response } from 'express'
import { serverAlertEngine } from '../services/alertEngine'
import { serverAgentEngine  } from '../services/agentEngine'
import { priceService        } from '../services/priceService'

const router = Router()
const SECRET = process.env.SERVER_SECRET ?? ''

// ── Auth middleware ────────────────────────────────────────────────────────
function auth(req: Request, res: Response, next: Function) {
  const token = req.headers['x-server-secret']
  if (token !== SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

// ── Health check ──────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'lbrain-server',
    uptime:  Math.floor(process.uptime()),
    alerts:  serverAlertEngine.getAlerts().length,
    rules:   serverAgentEngine.getRules().length,
    time:    new Date().toISOString(),
  })
})

// ── Price routes ──────────────────────────────────────────────────────────
router.get('/price/:symbol', async (req, res) => {
  try {
    const sym   = `${req.params.symbol.toLowerCase()}_usdt`
    const price = await priceService.getPrice(sym)
    res.json({ success: true, symbol: req.params.symbol.toUpperCase(), price })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/movers', async (_req, res) => {
  try {
    const data = await priceService.getTopMoversServer(10)
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Alert routes ──────────────────────────────────────────────────────────
router.get('/alerts', auth, (_req, res) => {
  res.json({ success: true, data: serverAlertEngine.getAlerts() })
})

router.post('/alerts', auth, (req, res) => {
  const alert = req.body
  if (!alert?.id || !alert?.symbol || !alert?.condition || !alert?.target) {
    res.status(400).json({ error: 'Missing required fields: id, symbol, condition, target' })
    return
  }
  serverAlertEngine.addAlert(alert)
  res.json({ success: true, message: `Alert ${alert.id} registered` })
})

router.delete('/alerts/:id', auth, (req, res) => {
  serverAlertEngine.removeAlert(req.params.id)
  res.json({ success: true, message: `Alert ${req.params.id} removed` })
})

router.post('/alerts/:id/reset', auth, (req, res) => {
  serverAlertEngine.resetFired(req.params.id)
  res.json({ success: true, message: `Alert ${req.params.id} reset` })
})

// ── Agent rule routes ──────────────────────────────────────────────────────
router.get('/rules', auth, (_req, res) => {
  res.json({ success: true, data: serverAgentEngine.getRules() })
})

router.post('/rules', auth, (req, res) => {
  const rule = req.body
  if (!rule?.id || !rule?.symbol || !rule?.trigger || !rule?.action) {
    res.status(400).json({ error: 'Missing required fields: id, symbol, trigger, action' })
    return
  }
  serverAgentEngine.addRule(rule)
  res.json({ success: true, message: `Rule ${rule.id} registered` })
})

router.delete('/rules/:id', auth, (req, res) => {
  serverAgentEngine.removeRule(req.params.id)
  res.json({ success: true, message: `Rule ${req.params.id} removed` })
})

// ── Status ────────────────────────────────────────────────────────────────
router.get('/status', auth, (_req, res) => {
  res.json({
    success:     true,
    alerts:      { total: serverAlertEngine.getAlerts().length, active: serverAlertEngine.getAlerts().filter(a => a.active).length, fired: serverAlertEngine.getFired().length },
    rules:       { total: serverAgentEngine.getRules().length,  active: serverAgentEngine.getRules().filter(r => r.active).length  },
    uptime:      Math.floor(process.uptime()),
    memory:      process.memoryUsage().heapUsed,
    time:        new Date().toISOString(),
  })
})

export default router
