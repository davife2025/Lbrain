-- ============================================================
-- LBrain Supabase Schema — Full Version
-- Run this in your Supabase SQL editor
-- ============================================================

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
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  name           text not null,
  symbol         text not null,
  trigger_type   text not null,
  trigger_value  numeric not null,
  action_type    text not null,
  active         boolean default true,
  last_triggered timestamptz,
  created_at     timestamptz default now()
);

-- ── Chat history ──────────────────────────────────────────────
create table if not exists chat_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  role       text check (role in ('user','assistant')) not null,
  content    text not null,
  tools_used text[],
  created_at timestamptz default now()
);

-- ── Notifications (from Render server) ───────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  type       text not null,
  data       jsonb,
  message    text,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ── RLS Policies ──────────────────────────────────────────────
alter table user_settings  enable row level security;
alter table alerts         enable row level security;
alter table agent_rules    enable row level security;
alter table chat_history   enable row level security;
alter table notifications  enable row level security;

create policy "Users manage own settings"       on user_settings  for all using (auth.uid() = user_id);
create policy "Users manage own alerts"         on alerts         for all using (auth.uid() = user_id);
create policy "Users manage own rules"          on agent_rules    for all using (auth.uid() = user_id);
create policy "Users manage own chat history"   on chat_history   for all using (auth.uid() = user_id);
create policy "Users manage own notifications"  on notifications  for all using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists alerts_user_active_idx        on alerts(user_id, active);
create index if not exists agent_rules_user_active_idx   on agent_rules(user_id, active);
create index if not exists chat_history_user_created_idx on chat_history(user_id, created_at desc);
create index if not exists notifications_user_read_idx   on notifications(user_id, read, created_at desc);

-- ── Updated at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
