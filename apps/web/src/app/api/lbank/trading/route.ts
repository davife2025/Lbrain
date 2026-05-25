import { NextRequest, NextResponse } from 'next/server'
import {
  LBankClient,
  placeOrder, cancelOrder, cancelAllOrders,
  getOpenOrders, getOrderHistory, getOrder,
} from '@lbrain/lbank-skills'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function getCredentials(req: NextRequest) {
  const apiKey    = req.headers.get('x-lbank-key')
  const secretKey = req.headers.get('x-lbank-secret')
  if (!apiKey || !secretKey) return null
  return { apiKey, secretKey }
}

export async function POST(req: NextRequest) {
  const ip  = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl  = rateLimit(`trade:${ip}`, 'trade')
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const creds = getCredentials(req)
  if (!creds)  return NextResponse.json({ error: 'LBank API key required' }, { status: 401 })

  const body   = await req.json()
  const { action, ...params } = body
  const client = new LBankClient(creds)

  try {
    switch (action) {
      case 'place_order':
        return NextResponse.json({ success: true, data: await placeOrder(client, params) })

      case 'cancel_order':
        return NextResponse.json({ success: true, data: await cancelOrder(client, params.symbol, params.orderId) })

      case 'cancel_all':
        return NextResponse.json({ success: true, data: await cancelAllOrders(client, params.symbol) })

      case 'open_orders':
        return NextResponse.json({ success: true, data: await getOpenOrders(client, params.symbol) })

      case 'order_history':
        return NextResponse.json({ success: true, data: await getOrderHistory(client, params.symbol, 2, 1, params.size ?? 20) })

      case 'get_order':
        return NextResponse.json({ success: true, data: await getOrder(client, params.symbol, params.orderId) })

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error(`[lbank/trading] ${action}:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
