/**
 * supabaseSync.ts
 * Layer đồng bộ dữ liệu giữa localStorage và Supabase.
 *
 * Chiến lược Hybrid Cache:
 *  - App đọc/ghi localStorage (sync, nhanh) → UI không bao giờ chờ
 *  - Mỗi khi lưu dữ liệu → tự động sync lên Supabase (background, fire-and-forget)
 *  - Khi app khởi động → load data từ Supabase vào localStorage
 *  - Hỗ trợ đồng bộ cả các bảng chuẩn và các cấu hình mở rộng (Bữa sáng, Góc của Mẹ, Cỡ chữ/Font...)
 *    thông qua cơ chế KV Store tích hợp sẵn trên bảng ktt_timetable_legend (không cần chạy lại SQL migration).
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
  ktt_exam_prep_tasks: 'ktt_exam_prep_tasks',
};

// Các key mở rộng được đồng bộ tự động lên Cloud qua KV-store trên bảng ktt_timetable_legend
export const SYS_KV_STORAGE_KEYS = new Set<string>([
  'ktt_breakfast_plans',
  'ktt_breakfast_settings',
  'ktt_breakfast_dishes',
  'ktt_typography_settings',
  'ktt_mother_meals',
  'ktt_mother_workouts',
  'ktt_mother_checkins',
  'ktt_mother_settings',
  'ktt_settings',
]);

const KV_HOST_TABLE = 'ktt_timetable_legend';
const KV_PREFIX = '__sys_kv__';

// All table entries for loadAll
const ALL_TABLES = Object.entries(STORAGE_TO_TABLE).map(([storageKey, table]) => ({
  storageKey,
  table,
}));

interface SysKvEnvelope {
  id: string;
  __sys_kv: true;
  key: string;
  value: unknown;
  updated_at: string;
}

/**
 * Lưu 1 key bất kỳ (array hoặc object) lên Cloud thông qua KV_HOST_TABLE
 */
export function upsertKvToCloud(storageKey: string, value: unknown): Promise<void> {
  const rowId = `${KV_PREFIX}${storageKey}`;
  const envelope: SysKvEnvelope = {
    id: rowId,
    __sys_kv: true,
    key: storageKey,
    value,
    updated_at: new Date().toISOString(),
  };

  return (async () => {
    const { error } = await supabase
      .from(KV_HOST_TABLE)
      .upsert(
        [
          {
            id: rowId,
            data: envelope,
            synced_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      );
    if (error) {
      console.warn(`[SupabaseSync] KV Upsert error on ${storageKey}:`, error.message);
    }
  })();
}

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
  const foundKvKeys = new Set<string>();

  const results = await Promise.allSettled(
    ALL_TABLES.map(async ({ table, storageKey }) => {
      const { data, error } = await supabase.from(table).select('id, data');
      if (error) {
        console.warn(`[SupabaseSync] Load failed for ${table}:`, error.message);
        return;
      }

      if (table === KV_HOST_TABLE) {
        const normalLegendRecords: unknown[] = [];
        for (const row of data ?? []) {
          const item = row.data as any;
          const rowId = String(row.id || item?.id || '');
          if (rowId.startsWith(KV_PREFIX) || item?.__sys_kv === true) {
            const k = item?.key || rowId.replace(KV_PREFIX, '');
            if (k && item?.value !== undefined) {
              foundKvKeys.add(k);
              localStorage.setItem(k, JSON.stringify(item.value));
            }
          } else if (item) {
            normalLegendRecords.push(item);
          }
        }
        if (normalLegendRecords.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(normalLegendRecords));
        }
        return;
      }

      const records = (data ?? []).map((row: { data: unknown }) => row.data);
      if (records.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(records));
      }
    })
  );

  // Nếu có các KV key đã có ở local nhưng trên Cloud chưa có → đẩy lên Cloud để không bị mất
  for (const kvKey of SYS_KV_STORAGE_KEYS) {
    if (!foundKvKeys.has(kvKey)) {
      const raw = localStorage.getItem(kvKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          await upsertKvToCloud(kvKey, parsed);
        } catch {}
      }
    }
  }

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

  for (const kvKey of SYS_KV_STORAGE_KEYS) {
    const raw = localStorage.getItem(kvKey);
    if (raw) {
      try {
        await upsertKvToCloud(kvKey, JSON.parse(raw));
      } catch {}
    }
  }

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ktt-cloud-synced'));
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseSync] ⚠️ Sync failed, using local cache:', err);
    return false;
  }
}
