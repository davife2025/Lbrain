import { NextRequest, NextResponse } from 'next/server'
import {
  getTicker, getAllTickers, getTopMovers,
  getOrderBook, getKlines, getRecentTrades,
  getTradingPairs, getMarketSummary,
} from '@lbrain/lbank-skills'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = rateLimit(`market:${ip}`, 'market')
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const skill  = searchParams.get('skill') ?? ''
  const symbol = searchParams.get('symbol') ?? ''

  try {
    switch (skill) {
      case 'ticker':
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        return NextResponse.json({ success: true, data: await getTicker(symbol) })

      case 'all-tickers':
        return NextResponse.json({ success: true, data: await getAllTickers() })

      case 'top-movers': {
        const limit = parseInt(searchParams.get('limit') ?? '10')
        return NextResponse.json({ success: true, data: await getTopMovers(limit) })
      }

      case 'orderbook': {
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        const size = parseInt(searchParams.get('size') ?? '10')
        return NextResponse.json({ success: true, data: await getOrderBook(symbol, size) })
      }

      case 'klines': {
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        const interval = searchParams.get('interval') ?? 'hour1'
        const size     = parseInt(searchParams.get('size') ?? '100')
        return NextResponse.json({ success: true, data: await getKlines(symbol, interval, size) })
      }

      case 'trades': {
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        const size = parseInt(searchParams.get('size') ?? '50')
        return NextResponse.json({ success: true, data: await getRecentTrades(symbol, size) })
      }

      case 'pairs':
        return NextResponse.json({ success: true, data: await getTradingPairs() })

      case 'summary':
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
        return NextResponse.json({ success: true, data: await getMarketSummary(symbol) })

      default:
        return NextResponse.json({ error: `Unknown skill: ${skill}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error(`[lbank/market] ${skill}:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
