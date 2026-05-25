/**
 * packages/lbank-skills/src/index.ts
 * LBrain LBank Skills — unified export.
 * This is the crown jewel of the LBrain monorepo.
 */

// Client & types
export * from './client'

// Market skills (public)
export * from './market'

// Account skills (private)
export * from './account'

// Trading skills (private)
export * from './trading'

// WebSocket streams (client-side)
export * from './websocket'

// ── Skill manifest — used by AI agent for tool definitions ────────────────
export const LBANK_SKILL_MANIFEST = [
  // ── Public market skills ──
  {
    name:        'get_ticker',
    description: 'Get live price and 24h stats for any LBank trading pair.',
    category:    'market',
    auth:        false,
    params:      [{ name: 'symbol', type: 'string', required: true, description: 'e.g. btc_usdt' }],
  },
  {
    name:        'get_all_tickers',
    description: 'Get live prices for all trading pairs on LBank.',
    category:    'market',
    auth:        false,
    params:      [],
  },
  {
    name:        'get_top_movers',
    description: 'Get the top gaining and losing coins on LBank in the last 24 hours.',
    category:    'market',
    auth:        false,
    params:      [{ name: 'limit', type: 'number', required: false, description: 'Number of results (default 10)' }],
  },
  {
    name:        'get_order_book',
    description: 'Get the current order book (bids and asks) for a trading pair.',
    category:    'market',
    auth:        false,
    params:      [
      { name: 'symbol', type: 'string', required: true  },
      { name: 'size',   type: 'number', required: false },
    ],
  },
  {
    name:        'get_klines',
    description: 'Get candlestick/OHLCV chart data for technical analysis.',
    category:    'market',
    auth:        false,
    params:      [
      { name: 'symbol',   type: 'string', required: true  },
      { name: 'interval', type: 'string', required: false, description: 'minute1, minute5, minute15, minute30, hour1, hour4, day1' },
      { name: 'size',     type: 'number', required: false },
    ],
  },
  {
    name:        'get_recent_trades',
    description: 'Get the most recent trades executed for a trading pair.',
    category:    'market',
    auth:        false,
    params:      [
      { name: 'symbol', type: 'string', required: true  },
      { name: 'size',   type: 'number', required: false },
    ],
  },
  {
    name:        'get_trading_pairs',
    description: 'Get a list of all available trading pairs on LBank.',
    category:    'market',
    auth:        false,
    params:      [],
  },
  {
    name:        'get_market_summary',
    description: 'Get a clean AI-friendly market summary: price, change, sentiment.',
    category:    'market',
    auth:        false,
    params:      [{ name: 'symbol', type: 'string', required: true }],
  },
  // ── Private account skills ──
  {
    name:        'get_balances',
    description: "Get the user's LBank wallet balances for all assets.",
    category:    'account',
    auth:        true,
    params:      [],
  },
  {
    name:        'get_portfolio_value',
    description: "Get the user's portfolio with estimated USDT values.",
    category:    'account',
    auth:        true,
    params:      [],
  },
  {
    name:        'get_transaction_history',
    description: "Get the user's past transaction records.",
    category:    'account',
    auth:        true,
    params:      [
      { name: 'symbol', type: 'string', required: true  },
      { name: 'size',   type: 'number', required: false },
    ],
  },
  // ── Private trading skills ──
  {
    name:        'place_order',
    description: 'Place a new spot order on LBank.',
    category:    'trading',
    auth:        true,
    params:      [
      { name: 'symbol', type: 'string', required: true, description: 'e.g. btc_usdt'                        },
      { name: 'side',   type: 'string', required: true, description: 'buy or sell'                          },
      { name: 'type',   type: 'string', required: true, description: 'limit or market'                      },
      { name: 'amount', type: 'number', required: true                                                       },
      { name: 'price',  type: 'number', required: false, description: 'Required for limit orders'           },
    ],
  },
  {
    name:        'cancel_order',
    description: 'Cancel an open order by order ID.',
    category:    'trading',
    auth:        true,
    params:      [
      { name: 'symbol',  type: 'string', required: true },
      { name: 'orderId', type: 'string', required: true },
    ],
  },
  {
    name:        'cancel_all_orders',
    description: 'Cancel all open orders for a trading pair.',
    category:    'trading',
    auth:        true,
    params:      [{ name: 'symbol', type: 'string', required: true }],
  },
  {
    name:        'get_open_orders',
    description: "Get all of the user's currently open (unfilled) orders.",
    category:    'trading',
    auth:        true,
    params:      [{ name: 'symbol', type: 'string', required: true }],
  },
  {
    name:        'get_order_history',
    description: "Get the user's historical orders for a trading pair.",
    category:    'trading',
    auth:        true,
    params:      [
      { name: 'symbol', type: 'string', required: true  },
      { name: 'size',   type: 'number', required: false },
    ],
  },
] as const
