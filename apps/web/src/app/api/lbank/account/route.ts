import { NextRequest, NextResponse } from 'next/server'
import {
  LBankClient, getTicker,
  getBalances, getPortfolioValue, getTransactionHistory,
} from '@lbrain/lbank-skills'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function getCredentials(req: NextRequest) {
  const apiKey    = req.headers.get('x-lbank-key')
  const secretKey = req.headers.get('x-lbank-secret')
  if (!apiKey || !secretKey) return null
  return { apiKey, secretKey }
}

export async function GET(req: NextRequest) {
  const ip   = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl   = rateLimit(`account:${ip}`, 'default')
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const creds = getCredentials(req)
  if (!creds)  return NextResponse.json({ error: 'LBank API key required' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const skill  = searchParams.get('skill') ?? ''
  const client = new LBankClient(creds)

  try {
    switch (skill) {
      case 'balances':
        return NextResponse.json({ success: true, data: await getBalances(client) })

      case 'portfolio':
        return NextResponse.json({
          success: true,
          data: await getPortfolioValue(client, async (sym) => (await getTicker(sym)).price),
        })

      case 'transactions': {
        const symbol = searchParams.get('symbol') ?? ''
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        return NextResponse.json({ success: true, data: await getTransactionHistory(client, symbol) })
      }

      default:
        return NextResponse.json({ error: `Unknown skill: ${skill}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error(`[lbank/account] ${skill}:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
