create extension if not exists pgcrypto;

create table if not exists devices (
  device_id        text primary key,
  handle           text,
  opted_in         boolean not null default false,
  consent_at       timestamptz,
  consent_version  text,
  points_balance   numeric not null default 0 check (points_balance >= 0),
  lifetime_points  numeric not null default 0,
  streak           int not null default 0,
  multiplier       numeric not null default 1.0,
  last_active_at   timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists revenue_events (
  id             bigserial primary key,
  device_id      text not null references devices(device_id) on delete cascade,
  period         text not null,
  revenue_cents  int not null check (revenue_cents >= 0),
  points_awarded numeric not null,
  created_at     timestamptz not null default now(),
  unique (device_id, period)
);

create table if not exists redemptions (
  id           bigserial primary key,
  device_id    text not null references devices(device_id) on delete cascade,
  points_spent numeric not null,
  value_cents  int not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  code         text,
  note         text,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);

create table if not exists config (
  key   text primary key,
  value text not null
);

alter table devices        enable row level security;
alter table revenue_events enable row level security;
alter table redemptions    enable row level security;
alter table config         enable row level security;

create or replace function add_points(p_device_id text, p_delta numeric)
returns void language sql as $$
  update devices
     set points_balance  = points_balance + p_delta,
         lifetime_points = lifetime_points + p_delta
   where device_id = p_device_id;
$$;

create or replace function spend_points(p_device_id text, p_points numeric)
returns boolean language plpgsql as $$
declare
  ok boolean;
begin
  update devices
     set points_balance = points_balance - p_points
   where device_id = p_device_id
     and points_balance >= p_points
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

insert into config (key, value) values
  ('payout_pct',       '0.5'),
  ('points_per_cent',  '1'),
  ('points_per_dollar','100'),
  ('threshold_points', '2500')
on conflict (key) do nothing;
