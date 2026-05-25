-- ============================================================
-- LBrain Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── User settings ────────────────────────────────────────────
create table if not exists user_settings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null unique,
  lbank_key_enc    text,
  lbank_sec_enc    text,
  auto_trade       boolean default false,
  chat_mode        text default 'assistant',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Price alerts ──────────────────────────────────────────────
create table if not exists alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  symbol       text not null,
  condition    text check (condition in ('above','below')) not null,
  target       numeric not null,
  note         text,
  active       boolean default true,
  triggered_at timestamptz,
  created_at   timestamptz default now()
);

-- ── Agent rules ───────────────────────────────────────────────
create table if not exists agent_rules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  name          text not null,
  symbol        text not null,
  trigger_type  text not null,
  trigger_value numeric not null,
  action_type   text not null,
  active        boolean default true,
  last_triggered timestamptz,
  created_at    timestamptz default now()
);

-- ── Chat history (optional — for premium users) ───────────────
create table if not exists chat_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  role       text check (role in ('user','assistant')) not null,
  content    text not null,
  tools_used text[],
  created_at timestamptz default now()
);

-- ── RLS Policies ──────────────────────────────────────────────

-- user_settings
alter table user_settings enable row level security;
create policy "Users can manage own settings"
  on user_settings for all
  using (auth.uid() = user_id);

-- alerts
alter table alerts enable row level security;
create policy "Users can manage own alerts"
  on alerts for all
  using (auth.uid() = user_id);

-- agent_rules
alter table agent_rules enable row level security;
create policy "Users can manage own rules"
  on agent_rules for all
  using (auth.uid() = user_id);

-- chat_history
alter table chat_history enable row level security;
create policy "Users can manage own chat history"
  on chat_history for all
  using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists alerts_user_id_idx      on alerts(user_id);
create index if not exists agent_rules_user_id_idx on agent_rules(user_id);
create index if not exists chat_history_user_id_idx on chat_history(user_id, created_at desc);

-- ── Updated at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
