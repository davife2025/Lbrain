# LBrain

**The AI brain for LBank** — live markets, AI-powered trading assistant, automated agent rules, and on-chain intelligence, all in one app.

---

## What is LBrain?

LBrain is a full-stack Next.js monorepo that gives LBank users an intelligent co-pilot. It's the first AI agent skills layer built specifically for LBank — combining live market data, conversational AI powered by Kimi K2, automated trading rules, price alerts, portfolio tracking, and Telegram messaging, all in a single clean interface.

---

## Monorepo Structure

```
lbrain/
├── apps/
│   └── web/                          ← Next.js frontend + backend API
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/
│       │   │   │   ├── ai/chat/      ← Streaming AI endpoint
│       │   │   │   ├── lbank/
│       │   │   │   │   ├── market/   ← Public market data
│       │   │   │   │   ├── account/  ← Private account data
│       │   │   │   │   └── trading/  ← Order management
│       │   │   │   └── openclaw/     ← Telegram/messaging gateway
│       │   │   ├── login/            ← Auth page
│       │   │   └── page.tsx          ← Main app shell
│       │   ├── components/
│       │   │   ├── tabs/             ← All tab views
│       │   │   ├── Sidebar.tsx       ← Slim icon sidebar
│       │   │   └── BottomNav.tsx     ← Mobile bottom nav
│       │   └── lib/
│       │       ├── auth.ts           ← NextAuth config
│       │       ├── store.ts          ← Zustand state
│       │       └── supabase.ts       ← Supabase client
├── packages/
│   ├── lbank-skills/                 ← THE crown jewel
│   │   └── src/
│   │       ├── client.ts             ← MD5/RSA signing + REST client
│   │       ├── market.ts             ← 8 public market skills
│   │       ├── account.ts            ← 3 private account skills
│   │       ├── trading.ts            ← 6 private trading skills
│   │       ├── websocket.ts          ← 3 real-time WebSocket streams
│   │       └── index.ts              ← Exports + skill manifest
│   └── ai/
│       └── src/
│           └── agent.ts              ← Kimi K2 agent wired to all 15 skills
└── supabase/
    └── schema.sql                    ← Database schema
```

---

## LBank Skills (15 total)

### Public Market Skills (no auth required)
| Skill | Description |
|---|---|
| `get_ticker` | Live price and 24h stats for any pair |
| `get_all_tickers` | Live prices for all LBank pairs |
| `get_top_movers` | Top gaining and losing coins |
| `get_order_book` | Current bids and asks |
| `get_klines` | Candlestick/OHLCV chart data |
| `get_recent_trades` | Latest executed trades |
| `get_trading_pairs` | All available pairs |
| `get_market_summary` | AI-friendly summary with sentiment |

### Private Account Skills (API key required)
| Skill | Description |
|---|---|
| `get_balances` | All wallet balances |
| `get_portfolio_value` | Balances with USDT valuations |
| `get_transaction_history` | Past transactions |

### Private Trading Skills (API key required)
| Skill | Description |
|---|---|
| `place_order` | Place market or limit orders |
| `cancel_order` | Cancel a specific order |
| `cancel_all_orders` | Cancel all open orders |
| `get_open_orders` | Current open orders |
| `get_order_history` | Historical orders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Monorepo | Turborepo |
| Language | TypeScript |
| Auth | NextAuth.js + Supabase Auth |
| Database | Supabase (PostgreSQL) |
| State | Zustand |
| AI Model | Kimi K2 via Hugging Face |
| Exchange | LBank REST + WebSocket API |
| Messaging | OpenClaw (Telegram, WhatsApp, Discord) |
| Styling | Tailwind CSS + CSS variables |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- Supabase project
- Hugging Face account (free)
- Optionally: LBank API key, Google OAuth, OpenClaw account

### Installation

```bash
git clone https://github.com/yourusername/lbrain.git
cd lbrain
npm install --ignore-scripts
cp apps/web/.env.example apps/web/.env.local
```

### Environment Variables

Fill in `apps/web/.env.local`:

```env
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
HUGGINGFACE_API_KEY=hf_your_token
OPENCLAW_SECRET=your_shared_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Setup

Run `supabase/schema.sql` in your Supabase SQL editor. It creates:
- `user_settings` — API keys (encrypted), preferences
- `alerts` — price alert rules
- `agent_rules` — automation rules
- `chat_history` — optional conversation history
- Row Level Security policies for all tables

---

## Connecting Telegram

1. Install OpenClaw: `npm install -g openclaw --ignore-scripts`
2. Use Node 22+: `nvm install 22 && nvm use 22`
3. Run: `openclaw onboard --install-daemon`
4. Set gateway URL in OpenClaw dashboard: `https://your-app.vercel.app/api/openclaw/message`
5. Set shared secret to match `OPENCLAW_SECRET`
6. Set Telegram webhook:

```bash
curl.exe -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"https://your-app.vercel.app/api/openclaw/message\"}"
```

**Available Telegram commands:**
- `/price BTC` — live LBank price
- `/movers` — top 24h gainers & losers
- `/summary ETH` — full market summary
- `/help` — all commands
- Or ask anything in natural language

---

## API Routes

| Route | Method | Description | Auth |
|---|---|---|---|
| `/api/ai/chat` | POST | Streaming AI chat | None |
| `/api/lbank/market` | GET | Public market data | None |
| `/api/lbank/account` | GET | Account balances | LBank keys |
| `/api/lbank/trading` | POST | Order management | LBank keys |
| `/api/openclaw/message` | POST | Messaging gateway | OpenClaw secret |
| `/api/openclaw/price` | GET | Quick price lookup | None |
| `/api/auth/callback` | GET | Supabase OAuth callback | None |

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy — `vercel.json` handles the rest

### Generate secrets

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# OPENCLAW_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Demo Credentials

```
Email:    demo@lbrain.ai
Password: demo1234
```

---

## Roadmap

- [ ] Session 5 — WebSocket live price streaming in UI
- [ ] Session 6 — LBank order book depth chart
- [ ] Session 7 — Agent rule execution engine
- [ ] Session 8 — Mobile app (React Native)

---

## License

MIT

---

## Acknowledgements

- [LBank API](https://github.com/LBank-exchange/lbank-official-api-docs) — exchange data and trading
- [OpenClaw](https://openclaw.ai) — messaging gateway
- [Kimi K2](https://huggingface.co/moonshotai/Kimi-K2-Instruct) — AI model
- [Supabase](https://supabase.com) — auth and database
- [Vercel](https://vercel.com) — deployment
- [Turborepo](https://turbo.build) — monorepo tooling
