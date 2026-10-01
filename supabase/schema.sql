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

create table if not exists ktt_tuition_payments (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_academic_milestones (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists ktt_exam_prep_tasks (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

-- ============================================================
-- MỞ TOÀN BỘ QUYỀN ĐỌC & GHI CHO APP GIA ĐÌNH (ANON KEY)
-- Khắc phục lỗi: "new row violates row-level security policy"
-- ============================================================

-- 1. Cấp quyền ALL trên schema public
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- 2. Tắt RLS và tạo Policy mở hoàn toàn cho tất cả các bảng ktt_*
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.tables 
    where table_schema = 'public' and table_name like 'ktt_%'
  loop
    -- Tắt RLS
    execute format('alter table %I disable row level security;', t);
    -- Cấp quyền
    execute format('grant all on table %I to anon, authenticated;', t);
    -- Tạo policy mở phòng hờ Supabase ép bật RLS
    execute format('drop policy if exists "allow_anon_all" on %I;', t);
    execute format('create policy "allow_anon_all" on %I for all to anon using (true) with check (true);', t);
  end loop;
end $$;

