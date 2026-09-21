-- ============================================================
-- KTT Family Timetable App - Supabase Database Schema
-- Chạy script này 1 lần trong Supabase SQL Editor
-- ============================================================

-- Mỗi bảng dùng pattern: id (text PK) + data (jsonb) + synced_at
-- Đơn giản, linh hoạt, không cần migration khi đổi TypeScript type

create table if not exists ktt_children (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_timetable_templates (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_timetable_entries (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_extra_schedules (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_schedule_exceptions (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_assessment_plans (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_assessments (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_performance_targets (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_achievement_records (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_school_years (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_teachers (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_subjects (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_timetable_legend (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_session_logs (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_homework (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_daily_teacher_comments (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

-- ============================================================
-- Tắt RLS (Row Level Security) - app gia đình, không cần auth
-- ============================================================
alter table ktt_children disable row level security;
alter table ktt_timetable_templates disable row level security;
alter table ktt_timetable_entries disable row level security;
alter table ktt_extra_schedules disable row level security;
alter table ktt_schedule_exceptions disable row level security;
alter table ktt_assessment_plans disable row level security;
alter table ktt_assessments disable row level security;
alter table ktt_performance_targets disable row level security;
alter table ktt_achievement_records disable row level security;
alter table ktt_school_years disable row level security;
alter table ktt_teachers disable row level security;
alter table ktt_subjects disable row level security;
alter table ktt_timetable_legend disable row level security;
alter table ktt_session_logs disable row level security;
alter table ktt_homework disable row level security;
alter table ktt_daily_teacher_comments disable row level security;

-- ============================================================
-- Cấp quyền cho anon key (publishable key)
-- ============================================================
grant all on ktt_children to anon, authenticated;
grant all on ktt_timetable_templates to anon, authenticated;
grant all on ktt_timetable_entries to anon, authenticated;
grant all on ktt_extra_schedules to anon, authenticated;
grant all on ktt_schedule_exceptions to anon, authenticated;
grant all on ktt_assessment_plans to anon, authenticated;
grant all on ktt_assessments to anon, authenticated;
grant all on ktt_performance_targets to anon, authenticated;
grant all on ktt_achievement_records to anon, authenticated;
grant all on ktt_school_years to anon, authenticated;
grant all on ktt_teachers to anon, authenticated;
grant all on ktt_subjects to anon, authenticated;
grant all on ktt_timetable_legend to anon, authenticated;
grant all on ktt_session_logs to anon, authenticated;
grant all on ktt_homework to anon, authenticated;
grant all on ktt_daily_teacher_comments to anon, authenticated;
