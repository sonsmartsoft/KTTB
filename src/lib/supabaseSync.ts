/**
 * supabaseSync.ts
 * Layer đồng bộ dữ liệu giữa localStorage và Supabase.
 *
 * Chiến lược Hybrid Cache:
 *  - App đọc/ghi localStorage (sync, nhanh) → UI không bao giờ chờ
 *  - Mỗi khi lưu dữ liệu → tự động sync lên Supabase (background, fire-and-forget)
 *  - Khi app khởi động → load data từ Supabase vào localStorage
 *  - Lần đầu dùng (Supabase trống) → đẩy seed data từ localStorage lên cloud
 */

import { supabase } from './supabase';

// Mapping: localStorage key → Supabase table name
export const STORAGE_TO_TABLE: Record<string, string> = {
  ktt_children: 'ktt_children',
  ktt_templates: 'ktt_timetable_templates',
  ktt_entries: 'ktt_timetable_entries',
  ktt_extra_schedules: 'ktt_extra_schedules',
  ktt_exceptions: 'ktt_schedule_exceptions',
  ktt_assessment_plans: 'ktt_assessment_plans',
  ktt_assessments: 'ktt_assessments',
  ktt_targets: 'ktt_performance_targets',
  ktt_achievements: 'ktt_achievement_records',
  ktt_school_years: 'ktt_school_years',
  ktt_teachers: 'ktt_teachers',
  ktt_subjects: 'ktt_subjects',
  ktt_timetable_legend: 'ktt_timetable_legend',
  ktt_session_logs: 'ktt_session_logs',
  ktt_homework: 'ktt_homework',
  ktt_daily_teacher_comments: 'ktt_daily_teacher_comments',
  ktt_tuition_payments: 'ktt_tuition_payments',
  ktt_academic_milestones: 'ktt_academic_milestones',
};

// All table entries for loadAll
const ALL_TABLES = Object.entries(STORAGE_TO_TABLE).map(([storageKey, table]) => ({
  storageKey,
  table,
}));

/**
 * Kiểm tra Supabase có dữ liệu chưa (để detect lần đầu chạy)
 */
async function hasCloudData(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('ktt_children')
      .select('id')
      .limit(1);
    if (error) return false;
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Load tất cả data từ Supabase → ghi vào localStorage
 * Gọi khi app khởi động (sau lần đầu setup)
 */
async function loadFromCloud(): Promise<void> {
  const results = await Promise.allSettled(
    ALL_TABLES.map(async ({ table, storageKey }) => {
      const { data, error } = await supabase.from(table).select('data');
      if (error) {
        console.warn(`[SupabaseSync] Load failed for ${table}:`, error.message);
        return;
      }
      const records = (data ?? []).map((row: { data: unknown }) => row.data);
      if (records.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(records));
      }
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`[SupabaseSync] ${failed}/${ALL_TABLES.length} tables failed to load.`);
  }
}

/**
 * Đẩy toàn bộ data trong localStorage lên Supabase
 * Gọi khi lần đầu tiên (cloud trống, migrate seed data)
 */
async function pushLocalToCloud(): Promise<void> {
  await Promise.allSettled(
    ALL_TABLES.map(async ({ table, storageKey }) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      let records: unknown[];
      try {
        records = JSON.parse(raw);
      } catch {
        return;
      }
      if (!Array.isArray(records) || records.length === 0) return;
      await upsertToTable(table, records);
    })
  );
  console.log('[SupabaseSync] ✅ Initial data migrated to cloud.');
}

/**
 * Upsert array of records vào Supabase table (fire-and-forget safe)
 * Không cần await — gọi từ storage setItem là an toàn
 */
export function upsertToTable(tableName: string, records: unknown[]): Promise<void> {
  if (!records || records.length === 0) return Promise.resolve();
  const rows = records.map((r) => ({
    id: String((r as { id: string }).id),
    data: r,
    synced_at: new Date().toISOString(),
  }));

  return (async () => {
    const { error } = await supabase
      .from(tableName)
      .upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn(`[SupabaseSync] Upsert error on ${tableName}:`, error.message);
    }
  })();
}

/**
 * Xoá một record khỏi Supabase (fire-and-forget safe)
 */
export function deleteFromTable(tableName: string, id: string): void {
  supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    .then(({ error }) => {
      if (error) {
        console.warn(`[SupabaseSync] Delete error on ${tableName}:`, error.message);
      }
    });
}

/**
 * Hàm chính: gọi khi app khởi động.
 *  - Cloud trống → đẩy localStorage seed data lên
 *  - Cloud có data → load về localStorage
 * Returns: true nếu sync thành công, false nếu offline/lỗi
 */
export async function syncOnStart(): Promise<boolean> {
  try {
    const hasData = await hasCloudData();
    if (hasData) {
      await loadFromCloud();
      console.log('[SupabaseSync] ✅ Loaded data from cloud.');
    } else {
      await pushLocalToCloud();
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseSync] ⚠️ Sync failed, using local cache:', err);
    return false;
  }
}
