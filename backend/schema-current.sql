-- Dark Bot AI — Supabase Affiliate System schema
-- This file mirrors the current production-foundation design.
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'affiliate_status') then
    create type public.affiliate_status as enum ('pending','active','paused','suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'customer_status') then
    create type public.customer_status as enum ('lead','payment_pending','paid','setup_pending','active','refunded','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending','received','refunded','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type public.commission_status as enum ('pending','approved','paid','cancelled');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'affiliate' check (role in ('admin','affiliate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  affiliate_code text not null unique,
  name text not null,
  brand_name text,
  email text,
  telegram_username text,
  platform text,
  profile_url text,
  commission_rate numeric(5,2) not null default 30.00 check (commission_rate >= 0 and commission_rate <= 100),
  status public.affiliate_status not null default 'pending',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referral_code text not null,
  visitor_id text,
  landing_page text,
  event_type text not null default 'visit' check (event_type in ('visit','telegram_click','lead','conversion')),
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  affiliate_id uuid references public.affiliates(id) on delete set null,
  referral_code text,
  full_name text,
  telegram_username text,
  telegram_reference text,
  plan_name text not null default 'Lifetime Access',
  revenue numeric(12,2) not null default 0 check (revenue >= 0),
  payment_status public.payment_status not null default 'pending',
  status public.customer_status not null default 'lead',
  first_seen_at timestamptz not null default now(),
  paid_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  revenue_amount numeric(12,2) not null check (revenue_amount >= 0),
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  status public.commission_status not null default 'pending',
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id)
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_affiliates_user_id on public.affiliates(user_id);
create index if not exists idx_affiliates_code on public.affiliates(affiliate_code);
create index if not exists idx_affiliates_status on public.affiliates(status);
create index if not exists idx_referral_events_affiliate_id on public.referral_events(affiliate_id);
create index if not exists idx_referral_events_visitor_id on public.referral_events(visitor_id);
create index if not exists idx_referral_events_event_type on public.referral_events(event_type);
create index if not exists idx_customers_affiliate_id on public.customers(affiliate_id);
create index if not exists idx_customers_telegram_reference on public.customers(telegram_reference);
create index if not exists idx_customers_status on public.customers(status);
create index if not exists idx_customers_payment_status on public.customers(payment_status);
create index if not exists idx_commissions_affiliate_id on public.commissions(affiliate_id);
create index if not exists idx_commissions_customer_id on public.commissions(customer_id);
create index if not exists idx_commissions_status on public.commissions(status);

alter table public.profiles enable row level security;
alter table public.affiliates enable row level security;
alter table public.referral_events enable row level security;
alter table public.customers enable row level security;
alter table public.commissions enable row level security;

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function private.my_affiliate_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.affiliates where user_id = (select auth.uid()) limit 1;
$$;
revoke execute on function private.my_affiliate_id() from public;
grant execute on function private.my_affiliate_id() to authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'affiliate')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;

-- The remaining RLS policies/grants are already applied in the live project.
-- Keep this file as the source-of-truth foundation for future migrations.
