/**
 * Vietnamese Public Holidays & Red-Day Detection
 *
 * Includes:
 *  - Tết Nguyên Đán (âm lịch 1/1 → kéo dài 1/1 đến 5/1 âl)
 *  - Giỗ Tổ Hùng Vương (âm lịch 10/3)
 *  - Solar fixed holidays: 1/1, 30/4, 1/5, 2/9
 *  - Chủ nhật (getDay() === 0)
 *  - Thứ 7 highlight nhẹ (optional)
 */

import { getLunarDateInfo } from './lunarCalendar';

export interface HolidayInfo {
  isRedDay: boolean;      // Chủ nhật / Lễ / Tết → chữ đỏ
  isSaturday: boolean;    // Thứ 7 → highlight nhẹ
  isSunday: boolean;
  holidayName?: string;   // Tên ngày lễ nếu có
  isLunarHoliday: boolean;
}

/** Danh sách ngày lễ theo dương lịch cố định (mm-dd) */
const SOLAR_HOLIDAYS: Record<string, { name: string; isOfficialOff: boolean }> = {
  '01-01': { name: 'Tết Dương Lịch', isOfficialOff: true },
  '03-08': { name: 'Quốc tế Phụ nữ', isOfficialOff: false },
  '04-30': { name: 'Giải phóng Miền Nam', isOfficialOff: true },
  '05-01': { name: 'Quốc tế Lao động', isOfficialOff: true },
  '06-01': { name: 'Quốc tế Thiếu nhi 🎈', isOfficialOff: false },
  '09-02': { name: 'Quốc khánh Việt Nam 🇻🇳', isOfficialOff: true },
  '09-03': { name: 'Nghỉ lễ Quốc khánh', isOfficialOff: true },
  '10-20': { name: 'Phụ nữ Việt Nam', isOfficialOff: false },
  '11-20': { name: 'Nhà giáo Việt Nam 💐', isOfficialOff: false },
  '12-25': { name: 'Giáng Sinh (Noel) 🎄', isOfficialOff: false },
};

/**
 * Kiểm tra ngày có phải ngày đỏ không (Chủ nhật, ngày lễ, Tết).
 * Chấp nhận Date object hoặc chuỗi 'yyyy-MM-dd'.
 */
export function getHolidayInfo(dateInput: Date | string): HolidayInfo {
  const d = typeof dateInput === 'string'
    ? (() => { const [y,m,day] = dateInput.split('-').map(Number); return new Date(y, m-1, day); })()
    : dateInput;

  const jsDay = d.getDay(); // 0=Sun, 6=Sat
  const isSunday   = jsDay === 0;
  const isSaturday = jsDay === 6;

  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const solarMatch = SOLAR_HOLIDAYS[mmdd];

  // Lunar check
  let lunarHolidayName: string | undefined;
  let isLunarHoliday = false;
  let isLunarOfficialOff = false;

  try {
    const lunar = getLunarDateInfo(d);
    const lm = lunar.lunarMonth;
    const ld = lunar.lunarDay;

    // Tết Nguyên Đán:
    // Cuối tháng Chạp (28, 29, 30 Tết)
    if (lm === 12 && ld >= 28) {
      lunarHolidayName = ld >= 30 ? 'Giao Thừa (30 Tết) 🧧' : `${ld} Tết (Tất Niên) 🧧`;
      isLunarHoliday = true;
      isLunarOfficialOff = true;
    }
    // Mùng 1 đến Mùng 5 Tết
    else if (lm === 1 && ld >= 1 && ld <= 5) {
      lunarHolidayName = ld === 1 ? 'Mùng 1 Tết Nguyên Đán 🧧' : `Mùng ${ld} Tết 🧧`;
      isLunarHoliday = true;
      isLunarOfficialOff = true;
    }
    // Ông Công Ông Táo: 23 tháng Chạp
    else if (lm === 12 && ld === 23) {
      lunarHolidayName = 'Tiễn Táo Quân 🐟';
      isLunarHoliday = true;
    }
    // Giỗ Tổ Hùng Vương: 10/3 âl (nghỉ chính thức)
    else if (lm === 3 && ld === 10) {
      lunarHolidayName = 'Giỗ Tổ Hùng Vương 🇻🇳';
      isLunarHoliday = true;
      isLunarOfficialOff = true;
    }
    // Tết Nguyên Tiêu: 15/1 âl
    else if (lm === 1 && ld === 15) {
      lunarHolidayName = 'Rằm Tháng Giêng 🏮';
      isLunarHoliday = true;
    }
    // Tết Đoan Ngọ: 5/5 âl
    else if (lm === 5 && ld === 5) {
      lunarHolidayName = 'Tết Đoan Ngọ 🌾';
      isLunarHoliday = true;
    }
    // Lễ Vu Lan: 15/7 âl
    else if (lm === 7 && ld === 15) {
      lunarHolidayName = 'Vu Lan Báo Hiếu 🌺';
      isLunarHoliday = true;
    }
    // Tết Trung Thu: 15/8 âl
    else if (lm === 8 && ld === 15) {
      lunarHolidayName = 'Tết Trung Thu 🥮';
      isLunarHoliday = true;
    }
  } catch {
    // ignore lunar parse errors
  }

  const holidayName = solarMatch?.name || lunarHolidayName;
  const isOfficialOff = solarMatch?.isOfficialOff || isLunarOfficialOff;
  // Ngày đỏ: Chủ nhật, ngày nghỉ lễ/Tết chính thức, hoặc có lễ đặc biệt
  const isRedDay = isSunday || isOfficialOff || (isLunarHoliday && !isSaturday);

  return {
    isRedDay,
    isSaturday,
    isSunday,
    holidayName,
    isLunarHoliday,
  };
}

/**
 * Trả về class Tailwind cho số ngày (text color) dựa trên loại ngày.
 * isSelected: nếu ô đang được chọn (nền tối) → dùng màu sáng hơn
 */
export function getDayTextClass(
  info: HolidayInfo,
  isSelected = false,
  isOutOfMonth = false,
): string {
  if (isOutOfMonth) return isSelected ? 'text-white/40' : 'text-content-muted/40';
  if (isSelected) {
    if (info.isRedDay)   return 'text-red-200 font-black';
    if (info.isSaturday) return 'text-blue-200 font-bold';
    return 'text-primary-foreground font-bold';
  }
  if (info.isRedDay)   return 'text-red-600 dark:text-red-400 font-black';
  if (info.isSaturday) return 'text-blue-600 dark:text-blue-400 font-bold';
  return 'text-content-primary font-semibold';
}

/** Header label colour cho cột T7/CN trong grid header */
export function getWeekdayHeaderClass(index: number): string {
  // index 0-6 theo thứ T2→CN (index 5=T7, 6=CN)
  if (index === 6) return 'text-red-500 font-black';      // CN
  if (index === 5) return 'text-blue-500 font-bold';       // T7
  return 'text-content-muted font-bold';
}
