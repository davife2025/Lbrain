# LBrain — Deployment Guide

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│   Vercel (Web App)  │────▶│   Render (Server)    │
│                     │     │                      │
│  Next.js frontend   │     │  Express + Engines   │
│  API routes         │◀────│  Alert polling 30s   │
│  Auth (NextAuth)    │     │  Agent rules 60s     │
│  Supabase client    │     │  Price cache         │
└─────────────────────┘     └──────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│   Supabase          │     │   LBank API          │
│   Auth + Database   │     │   REST + WebSocket   │
└─────────────────────┘     └──────────────────────┘
```

---

## Step 1 — Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Optionally add a `notifications` table:

```sql
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  type       text not null,
  data       jsonb,
  message    text,
  read       boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
create policy "Users manage own notifications"
  on notifications for all using (auth.uid() = user_id);
```

4. Copy your **Project URL**, **anon key**, and **service role key**

---

## Step 2 — Deploy Render Server

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set these values:
   - **Root Directory:** `apps/server`
   - **Build Command:** `npm install --ignore-scripts && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for no sleep)

5. Add environment variables in Render dashboard:

```
PORT=3001
NODE_ENV=production
SERVER_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
WEB_APP_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENCLAW_SECRET=your_shared_secret
HUGGINGFACE_API_KEY=hf_your_token
```

6. Deploy — note your Render URL (e.g. `https://lbrain-server.onrender.com`)
7. Test health: `curl https://lbrain-server.onrender.com/api/health`

---

## Step 3 — Deploy Vercel Web App

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `apps/web`
4. Add environment variables:

```
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUGGINGFACE_API_KEY=hf_your_token
OPENCLAW_SECRET=your_shared_secret
RENDER_SERVER_URL=https://lbrain-server.onrender.com
SERVER_SECRET=<same value as Render>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

5. Deploy

---

## Step 4 — Connect Telegram (Optional)

1. Message **@BotFather** on Telegram → `/newbot`
2. Copy your bot token
3. Set the webhook (replace values):

```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://your-app.vercel.app/api/openclaw/message\"}"
```

4. On Windows PowerShell:

```powershell
curl.exe -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"https://your-app.vercel.app/api/openclaw/message\"}"
```

---

## Step 5 — Verify Everything

```bash
# 1. Render server health
curl https://lbrain-server.onrender.com/api/health

# 2. Vercel web app
curl https://your-app.vercel.app/api/lbank/market?skill=ticker&symbol=btc_usdt

# 3. AI chat
curl -X POST https://your-app.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"BTC price?"}],"mode":"assistant"}'

# 4. Server sync from web app
curl https://your-app.vercel.app/api/agent/sync
```

---

## Generate Secrets

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# SERVER_SECRET + OPENCLAW_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Demo Credentials

```
Email:    demo@lbrain.ai
Password: demo1234
```

---

## Troubleshooting

**Render server sleeping (free tier)**
Free tier sleeps after 15 mins of inactivity. Upgrade to Starter ($7/mo) for always-on, or use a cron job service to ping `/api/health` every 10 mins.

**API routes returning login page HTML**
Your `middleware.ts` is blocking API routes. Make sure `/api/` is excluded from auth checks.

**LBank endpoints returning 403**
LBank may block certain server IPs. Try adding browser-like headers in `packages/lbank-skills/src/client.ts`.

**WebSocket not connecting**
WebSockets only work client-side. Make sure components using `useLBankTicker` or `useLBankOrderBook` have `'use client'` at the top.
