-- ============================================
-- Migración 001: Crear todas las tablas
-- ============================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ============================================
-- GROUPS
-- ============================================
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null,
  prize text not null,
  annual_prize text,
  period text not null check (period in ('weekly', 'monthly')),
  created_at timestamptz not null default now()
);

create index idx_groups_invite_code on groups (invite_code);

-- ============================================
-- HABITS
-- ============================================
create table habits (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups (id) on delete cascade,
  name text not null,
  level integer not null check (level in (1, 2, 3))
);

create index idx_habits_group_id on habits (group_id);

-- ============================================
-- USERS
-- ============================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups (id) on delete cascade,
  nickname text not null,
  session_token text unique not null,
  created_at timestamptz not null default now()
);

create index idx_users_group_id on users (group_id);
create index idx_users_session_token on users (session_token);

-- ============================================
-- ROUNDS
-- ============================================
create table rounds (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  winner_id uuid references users (id) on delete set null,
  is_active boolean not null default true
);

create index idx_rounds_group_id on rounds (group_id);
create index idx_rounds_active on rounds (group_id, is_active) where is_active = true;

-- ============================================
-- COMPLETIONS
-- ============================================
create table completions (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references habits (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  photo_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  validated_by uuid references users (id) on delete set null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_completions_user_id on completions (user_id);
create index idx_completions_habit_id on completions (habit_id);
create index idx_completions_status on completions (status) where status = 'pending';
-- Un hábito por usuario por día (solo se permite una completion activa no rechazada)
create unique index idx_completions_one_per_day
  on completions (habit_id, user_id, date)
  where status != 'rejected';
