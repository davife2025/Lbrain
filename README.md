# LBrain

> **The AI brain for LBank** — live markets, AI trading assistant, automated agent rules, portfolio tracking, price alerts, and Telegram messaging.

---

## Overview

LBrain is the first AI agent skills layer built specifically for LBank exchange. It combines 15 custom LBank skills, a Kimi K2 AI agent, real-time WebSocket streaming, a 24/7 Render backend server, and a clean Next.js frontend — all in a Turborepo monorepo.

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   Vercel (Web App)  │◀──────▶│   Render (Server)    │
│                     │        │                      │
│  Next.js 14         │        │  Express.js          │
│  AI Chat API        │        │  Alert engine (30s)  │
│  LBank market API   │        │  Agent engine (60s)  │
│  Trading API        │        │  Price cache         │
│  Auth (NextAuth)    │        │  Cron jobs           │
│  WebSocket client   │        │  Notification push   │
└─────────────────────┘        └──────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐        ┌──────────────────────┐
│   Supabase          │        │   LBank API          │
│   Auth + DB         │        │   REST + WebSocket   │
└─────────────────────┘        └──────────────────────┘
```

---

## Monorepo Structure

```
lbrain/
├── apps/
│   ├── web/                          ← Next.js (Vercel)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/
│   │       │   │   ├── ai/chat/      ← Streaming AI (Kimi K2)
│   │       │   │   ├── lbank/
│   │       │   │   │   ├── market/   ← Public market data
│   │       │   │   │   ├── account/  ← Account balances
│   │       │   │   │   └── trading/  ← Order management
│   │       │   │   ├── openclaw/     ← Telegram gateway
│   │       │   │   └── agent/
│   │       │   │       ├── notify/   ← Receives from Render
│   │       │   │       └── sync/     ← Syncs to Render
│   │       │   ├── login/
│   │       │   └── page.tsx
│   │       ├── components/
│   │       │   ├── tabs/             ← All 10 tabs
│   │       │   ├── charts/           ← Candle, OrderBook, Ticker
│   │       │   ├── Sidebar.tsx
│   │       │   ├── BottomNav.tsx
│   │       │   ├── NotificationBell.tsx
│   │       │   ├── ErrorBoundary.tsx
│   │       │   ├── Loading.tsx
│   │       │   ├── EmptyState.tsx
│   │       │   └── Toast.tsx
│   │       ├── hooks/
│   │       │   ├── useLBankTicker.ts    ← WebSocket live prices
│   │       │   ├── useLBankOrderBook.ts ← WebSocket order book
│   │       │   └── useEngines.ts        ← Alert + agent engines
│   │       └── lib/
│   │           ├── alertEngine.ts    ← Client-side alert polling
│   │           ├── agentEngine.ts    ← Client-side rule executor
│   │           ├── auth.ts
│   │           ├── store.ts          ← Zustand state
│   │           └── supabase.ts
│   └── server/                       ← Express.js (Render)
│       └── src/
│           ├── index.ts              ← Entry point
│           ├── cron.ts               ← Scheduled jobs
│           ├── routes/index.ts       ← REST API
│           └── services/
│               ├── alertEngine.ts    ← 24/7 alert polling
│               ├── agentEngine.ts    ← 24/7 rule executor
│               ├── priceService.ts   ← Price cache
│               └── notificationService.ts
├── packages/
│   ├── lbank-skills/                 ← 15 LBank skills (THE core)
│   │   └── src/
│   │       ├── client.ts             ← MD5/RSA signing
│   │       ├── market.ts             ← 8 public skills
│   │       ├── account.ts            ← 3 account skills
│   │       ├── trading.ts            ← 6 trading skills
│   │       ├── websocket.ts          ← 3 WS streams
│   │       └── index.ts              ← Skill manifest
│   └── ai/
│       └── src/agent.ts             ← Kimi K2 + 15 tools
├── supabase/schema.sql
├── render.yaml
├── vercel.json
└── turbo.json
```

---

## LBank Skills (15 total)

| Skill | Type | Description |
|---|---|---|
| `get_ticker` | Public | Live price + 24h stats |
| `get_all_tickers` | Public | All LBank pairs |
| `get_top_movers` | Public | Top gainers & losers |
| `get_order_book` | Public | Bids and asks depth |
| `get_klines` | Public | OHLCV candlestick data |
| `get_recent_trades` | Public | Latest executed trades |
| `get_trading_pairs` | Public | All available pairs |
| `get_market_summary` | Public | AI-friendly summary + sentiment |
| `get_balances` | Private | Wallet balances |
| `get_portfolio_value` | Private | Portfolio with USDT values |
| `get_transaction_history` | Private | Past transactions |
| `place_order` | Private | Market or limit orders |
| `cancel_order` | Private | Cancel by order ID |
| `cancel_all_orders` | Private | Cancel all open orders |
| `get_open_orders` | Private | Current open orders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Monorepo | Turborepo |
| Language | TypeScript |
| Auth | NextAuth.js + Supabase Auth |
| Database | Supabase (PostgreSQL + RLS) |
| State | Zustand |
| AI | Kimi K2 via Hugging Face |
| Exchange | LBank REST + WebSocket |
| Server | Express.js on Render |
| Messaging | OpenClaw (Telegram) |
| Fonts | Inter + DM Mono |
| Styling | Tailwind CSS + CSS variables |
| Deploy | Vercel + Render |

---

## Quick Start

### Prerequisites
- Node.js 22+
- Supabase project
- Hugging Face account (free)

### Install

```bash
git clone https://github.com/yourusername/lbrain.git
cd lbrain
npm install --ignore-scripts
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env
```

### Run locally

```bash
# Web app
cd apps/web && npm run dev

# Server (separate terminal)
cd apps/server && npm run dev
```

---

## Deployment

See **DEPLOY.md** for the full step-by-step guide covering:
- Supabase schema setup
- Render server deployment
- Vercel web app deployment
- Telegram webhook configuration
- Environment variable reference

---

## Environment Variables

### Web App (`apps/web/.env.local`)

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
HUGGINGFACE_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENCLAW_SECRET=
RENDER_SERVER_URL=https://lbrain-server.onrender.com
SERVER_SECRET=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Server (`apps/server/.env`)

```env
PORT=3001
SERVER_SECRET=
WEB_APP_URL=https://your-app.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENCLAW_SECRET=
HUGGINGFACE_API_KEY=
```

---

## API Reference

### Web App (Vercel)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/ai/chat` | POST | — | Streaming AI chat |
| `/api/lbank/market` | GET | — | Market data (ticker, klines, orderbook) |
| `/api/lbank/account` | GET | LBank keys | Balances, portfolio |
| `/api/lbank/trading` | POST | LBank keys | Place/cancel orders |
| `/api/openclaw/message` | POST | OpenClaw secret | Telegram webhook |
| `/api/openclaw/price` | GET | — | Quick price |
| `/api/agent/notify` | POST | Server secret | Receive from Render |
| `/api/agent/sync` | POST/GET | — | Sync to Render |

### Render Server

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | — | Health check |
| `/api/price/:symbol` | GET | — | Cached price |
| `/api/movers` | GET | — | Top movers |
| `/api/alerts` | GET/POST/DELETE | Server secret | Alert management |
| `/api/rules` | GET/POST/DELETE | Server secret | Rule management |
| `/api/status` | GET | Server secret | Engine status |

---

## Telegram Commands

Once connected via OpenClaw:

| Command | Description |
|---|---|
| `/price BTC` | Live LBank price |
| `/movers` | Top 24h gainers & losers |
| `/summary ETH` | Full market summary |
| `/help` | All commands |
| Natural language | Full AI responses |

---

## Demo Credentials

```
Email:    demo@lbrain.ai
Password: demo1234
```

---

## Sessions Completed

| Session | Content |
|---|---|
| 1+2 | Monorepo scaffold, 15 LBank skills, AI agent, auth, API routes |
| 3 | All 10 UI tabs (Dashboard, Chat, Markets, Portfolio, Trade, Alerts, Agent, Learn, Messaging, Settings) |
| 4 | Telegram gateway, Supabase schema, Vercel config, README |
| 5 | WebSocket streaming, CandleChart, OrderBookChart, LiveTickerStrip |
| 6 | Alert engine, Agent engine, NotificationBell, MessagingTab |
| 7 | Render server, 24/7 engines, DEPLOY.md, server sync routes |
| 8 | Font polish, icons, full candlestick chart, error boundaries, skeletons, SEO |

---

## License

MIT

---

*Built with LBank Skills Hub · Kimi K2 · OpenClaw · Supabase · Vercel · Render*
