/**
 * apps/server/src/services/agentEngine.ts
 * Server-side agent rule engine — runs 24/7 on Render.
 * Evaluates IF/THEN rules and executes trading actions.
 */

import { priceService } from './priceService'
import { LBankClient, placeOrder, cancelAllOrders } from '@lbrain/lbank-skills'

export interface ServerRule {
  id:           string
  userId:       string
  name:         string
  symbol:       string
  trigger:      string
  triggerValue: number
  action:       string
  active:       boolean
  lastRun:      string | null
  createdAt:    string
  // Encrypted credentials (decrypted server-side)
  apiKey?:      string
  apiSecret?:   string
}

export interface RuleExecution {
  ruleId:    string
  userId:    string
  ruleName:  string
  symbol:    string
  price:     number
  action:    string
  result:    string
  success:   boolean
  executedAt: string
}

class ServerAgentEngine {
  private rules:   ServerRule[]  = []
  private timer:   ReturnType<typeof setInterval> | null = null
  private onExec:  ((exec: RuleExecution) => void)[] = []
  private cooldowns = new Map<string, number>() // ruleId → last run ms
  private COOLDOWN  = 5 * 60 * 1000 // 5 min

  load(rules: ServerRule[]) {
    this.rules = rules
    console.log(`[AgentEngine] Loaded ${rules.length} rules`)
  }

  addRule(rule: ServerRule) {
    this.rules = this.rules.filter(r => r.id !== rule.id)
    this.rules.push(rule)
  }

  removeRule(id: string) {
    this.rules = this.rules.filter(r => r.id !== id)
    this.cooldowns.delete(id)
  }

  onExecution(cb: (exec: RuleExecution) => void) {
    this.onExec.push(cb)
  }

  start(intervalMs = 60_000) {
    if (this.timer) return
    console.log(`[AgentEngine] Started — checking every ${intervalMs/1000}s`)
    this.run()
    this.timer = setInterval(() => this.run(), intervalMs)
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  private async run() {
    const active = this.rules.filter(r => r.active)
    if (!active.length) return

    for (const rule of active) {
      // Check cooldown
      const lastRun = this.cooldowns.get(rule.id) ?? 0
      if (Date.now() - lastRun < this.COOLDOWN) continue

      try {
        await this.evaluate(rule)
      } catch (err: any) {
        console.error(`[AgentEngine] Rule ${rule.name} error:`, err.message)
      }
    }
  }

  private async evaluate(rule: ServerRule) {
    const pair  = `${rule.symbol.toLowerCase()}_usdt`
    const price = await priceService.getPrice(pair)

    const triggered = this.checkTrigger(rule.trigger, rule.triggerValue, price)
    if (!triggered) return

    console.log(`[AgentEngine] TRIGGERED: ${rule.name} — ${rule.symbol} @ $${price}`)

    const result = await this.executeAction(rule, price)

    // Set cooldown
    this.cooldowns.set(rule.id, Date.now())

    const exec: RuleExecution = {
      ruleId:     rule.id,
      userId:     rule.userId,
      ruleName:   rule.name,
      symbol:     rule.symbol,
      price,
      action:     rule.action,
      result:     result.message,
      success:    result.success,
      executedAt: new Date().toISOString(),
    }

    this.onExec.forEach(cb => cb(exec))
    console.log(`[AgentEngine] ${rule.name}: ${result.message}`)
  }

  private checkTrigger(trigger: string, value: number, price: number): boolean {
    switch (trigger) {
      case 'price_above': return price >= value
      case 'price_below': return price <= value
      case 'daily_time': {
        const now = new Date()
        return now.getHours() === Math.floor(value) && now.getMinutes() < 2
      }
      default: return false
    }
  }

  private async executeAction(rule: ServerRule, price: number): Promise<{ success: boolean; message: string }> {
    switch (rule.action) {
      case 'send_alert':
        return { success: true, message: `Alert: ${rule.symbol} @ $${price.toLocaleString()} — ${rule.name}` }

      case 'buy_market': {
        if (!rule.apiKey || !rule.apiSecret) return { success: false, message: 'No API key configured' }
        const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret })
        return await placeOrder(client, {
          symbol: `${rule.symbol.toLowerCase()}_usdt`,
          side:   'buy',
          type:   'market',
          amount: 0.001,
        })
      }

      case 'sell_market': {
        if (!rule.apiKey || !rule.apiSecret) return { success: false, message: 'No API key configured' }
        const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret })
        return await placeOrder(client, {
          symbol: `${rule.symbol.toLowerCase()}_usdt`,
          side:   'sell',
          type:   'market',
          amount: 0.001,
        })
      }

      case 'cancel_all': {
        if (!rule.apiKey || !rule.apiSecret) return { success: false, message: 'No API key configured' }
        const client = new LBankClient({ apiKey: rule.apiKey, secretKey: rule.apiSecret })
        return await cancelAllOrders(client, `${rule.symbol.toLowerCase()}_usdt`)
      }

      case 'post_report':
        return { success: true, message: `Report: ${rule.symbol} @ $${price.toLocaleString()}` }

      default:
        return { success: false, message: `Unknown action: ${rule.action}` }
    }
  }

  getRules() { return this.rules }
}

export const serverAgentEngine = new ServerAgentEngine()
