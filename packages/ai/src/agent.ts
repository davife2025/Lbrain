/**
 * packages/ai/src/agent.ts
 * LBrain AI Agent — Kimi K2 via Hugging Face
 * Wired to all LBank skills via function calling.
 */

import OpenAI from 'openai'
import {
  LBankClient,
  getTicker,
  getAllTickers,
  getTopMovers,
  getOrderBook,
  getKlines,
  getRecentTrades,
  getMarketSummary,
  getBalances,
  getPortfolioValue,
  getTransactionHistory,
  placeOrder,
  cancelOrder,
  cancelAllOrders,
  getOpenOrders,
  getOrderHistory,
  type LBankCredentials,
} from '@lbrain/lbank-skills'

// ── Kimi K2 client ─────────────────────────────────────────────────────────
const kimi = new OpenAI({
  apiKey:  process.env.HUGGINGFACE_API_KEY!,
  baseURL: 'https://router.huggingface.co/v1',
})

const MODEL = 'moonshotai/Kimi-K2-Instruct'

// ── Agent modes ────────────────────────────────────────────────────────────
export type AgentMode = 'assistant' | 'analyst' | 'trader' | 'educator'

const SYSTEM: Record<AgentMode, string> = {
  assistant: `You are LBrain, an elite AI assistant for LBank users. You have live access to LBank market data through 15 skills. Use tools to get real data — never guess prices. Be concise and data-driven. Use **bold** for prices and key metrics. Format numbers clearly.`,
  analyst:   `You are LBrain's market analyst. Use get_market_summary for overviews, get_klines for technical analysis, get_order_book for depth. Structure: current price → trend → key levels → bull/bear case.`,
  trader:    `You are LBrain's trading assistant. Always confirm details before placing orders. Use get_ticker to verify prices. Warn about risks. Never place orders without explicit user confirmation.`,
  educator:  `You are LBrain Academy — a crypto educator powered by LBank data. Explain concepts clearly with real examples. Use get_ticker for live price examples when relevant.`,
}

// ── Tool definitions ────────────────────────────────────────────────────────
const TOOLS: OpenAI.ChatCompletionTool[] = [
  // Market tools
  { type:'function', function:{ name:'get_ticker',         description:'Get live price and 24h stats for any LBank trading pair.',                  parameters:{ type:'object', properties:{ symbol:{ type:'string', description:'e.g. btc_usdt or BTC' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'get_all_tickers',    description:'Get live prices for all trading pairs on LBank.',                            parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'get_top_movers',     description:'Get the top gaining and losing coins on LBank in the last 24 hours.',        parameters:{ type:'object', properties:{ limit:{ type:'number' } } } } },
  { type:'function', function:{ name:'get_order_book',     description:'Get the current order book (bids and asks) for a trading pair.',             parameters:{ type:'object', properties:{ symbol:{ type:'string' }, size:{ type:'number' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'get_klines',         description:'Get candlestick chart data for technical analysis.',                         parameters:{ type:'object', properties:{ symbol:{ type:'string' }, interval:{ type:'string', description:'minute1,minute5,minute15,minute30,hour1,hour4,day1' }, size:{ type:'number' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'get_recent_trades',  description:'Get the most recent trades for a trading pair.',                             parameters:{ type:'object', properties:{ symbol:{ type:'string' }, size:{ type:'number' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'get_market_summary', description:'Get a clean AI-friendly market summary: price, change, sentiment.',          parameters:{ type:'object', properties:{ symbol:{ type:'string' } }, required:['symbol'] } } },
  // Account tools
  { type:'function', function:{ name:'get_balances',       description:"Get the user's LBank wallet balances.",                                      parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'get_portfolio_value',description:"Get the user's full portfolio with estimated USDT values.",                  parameters:{ type:'object', properties:{} } } },
  // Trading tools
  { type:'function', function:{ name:'get_open_orders',    description:"Get the user's open orders for a symbol.",                                   parameters:{ type:'object', properties:{ symbol:{ type:'string' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'get_order_history',  description:"Get the user's order history for a symbol.",                                 parameters:{ type:'object', properties:{ symbol:{ type:'string' }, size:{ type:'number' } }, required:['symbol'] } } },
  { type:'function', function:{ name:'place_order',        description:'Place a new spot order on LBank. Always confirm with user first.',           parameters:{ type:'object', properties:{ symbol:{ type:'string' }, side:{ type:'string', enum:['buy','sell'] }, type:{ type:'string', enum:['limit','market'] }, amount:{ type:'number' }, price:{ type:'number' } }, required:['symbol','side','type','amount'] } } },
  { type:'function', function:{ name:'cancel_order',       description:'Cancel an open order by order ID.',                                          parameters:{ type:'object', properties:{ symbol:{ type:'string' }, orderId:{ type:'string' } }, required:['symbol','orderId'] } } },
  { type:'function', function:{ name:'cancel_all_orders',  description:'Cancel all open orders for a trading pair.',                                 parameters:{ type:'object', properties:{ symbol:{ type:'string' } }, required:['symbol'] } } },
]

// ── Tool executor ───────────────────────────────────────────────────────────
async function executeTool(
  name:        string,
  args:        any,
  credentials?: LBankCredentials
): Promise<any> {
  const client = credentials ? new LBankClient(credentials) : null
  const requiresAuth = () => { if (!client) throw new Error('Connect your LBank API key to use this feature.') }

  switch (name) {
    case 'get_ticker':          return await getTicker(args.symbol)
    case 'get_all_tickers':     return await getAllTickers()
    case 'get_top_movers':      return await getTopMovers(args.limit ?? 10)
    case 'get_order_book':      return await getOrderBook(args.symbol, args.size ?? 10)
    case 'get_klines': {
      const klines = await getKlines(args.symbol, args.interval ?? 'hour1', args.size ?? 50)
      const closes = klines.map(k => k.close)
      return {
        symbol:  args.symbol,
        current: closes[closes.length - 1],
        high:    Math.max(...klines.map(k => k.high)),
        low:     Math.min(...klines.map(k => k.low)),
        change:  closes.length > 1 ? (((closes[closes.length-1] - closes[0]) / closes[0]) * 100).toFixed(2) + '%' : '0%',
        candles: klines.slice(-10),
      }
    }
    case 'get_recent_trades':   return await getRecentTrades(args.symbol, args.size ?? 20)
    case 'get_market_summary':  return await getMarketSummary(args.symbol)
    case 'get_balances':        requiresAuth(); return await getBalances(client!)
    case 'get_portfolio_value': requiresAuth(); return await getPortfolioValue(client!, async (sym) => (await getTicker(sym)).price)
    case 'get_open_orders':     requiresAuth(); return await getOpenOrders(client!, args.symbol)
    case 'get_order_history':   requiresAuth(); return await getOrderHistory(client!, args.symbol, 2, 1, args.size ?? 20)
    case 'place_order':         requiresAuth(); return await placeOrder(client!, args)
    case 'cancel_order':        requiresAuth(); return await cancelOrder(client!, args.symbol, args.orderId)
    case 'cancel_all_orders':   requiresAuth(); return await cancelAllOrders(client!, args.symbol)
    default:                    return { error: `Unknown tool: ${name}` }
  }
}

// ── Agent runner ────────────────────────────────────────────────────────────
export interface AgentMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface AgentResult {
  text:      string
  toolsUsed: string[]
}

export async function runAgent({
  messages,
  mode = 'assistant',
  credentials,
  onChunk,
}: {
  messages:     AgentMessage[]
  mode?:        AgentMode
  credentials?: LBankCredentials
  onChunk?:     (text: string) => void
}): Promise<AgentResult> {
  const toolsUsed: string[] = []
  const history: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM[mode] },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  for (let i = 0; i < 8; i++) {
    const response = await kimi.chat.completions.create({
      model:       MODEL,
      messages:    history,
      tools:       TOOLS,
      tool_choice: 'auto',
    })

    const msg  = response.choices[0].message
    history.push(msg as any)

    const text = msg.content ?? ''
    if (text && onChunk) onChunk(text)
    if (!msg.tool_calls?.length) return { text, toolsUsed }

    for (const tc of msg.tool_calls) {
      if (tc.type !== 'function') continue
      toolsUsed.push(tc.function.name)
      try {
        const args   = JSON.parse(tc.function.arguments)
        const result = await executeTool(tc.function.name, args, credentials)
        history.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
      } catch (err: any) {
        history.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: err.message }) })
      }
    }
  }

  const finalText = history.filter(m => m.role === 'assistant').map(m => m.content ?? '').join('')
  return { text: finalText, toolsUsed }
}
