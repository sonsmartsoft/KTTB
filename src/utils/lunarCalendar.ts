/**
 * Vietnamese Astronomical Lunar Calendar Algorithm
 * Developed based on the astronomical calculations by Ho Ngoc Duc.
 * Standard Timezone: GMT+7 (Vietnam)
 */

interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: number; // 1 if leap month, 0 otherwise
  dayName?: string;
  monthName?: string;
  yearName?: string;
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  const C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(2 * dr * Mpr) -
    0.0004 * Math.sin(3 * dr * Mpr) +
    0.0104 * Math.sin(2 * dr * F) -
    0.0051 * Math.sin((M + Mpr) * dr) -
    0.0074 * Math.sin((M - Mpr) * dr) +
    0.0004 * Math.sin((2 * F + M) * dr) -
    0.0004 * Math.sin((2 * F - M) * dr) -
    0.0006 * Math.sin((2 * F + Mpr) * dr) +
    0.001 * Math.sin((2 * F - Mpr) * dr) +
    0.0005 * Math.sin((2 * Mpr + M) * dr);
  const deltat =
    T < -4
      ? -0.00007 + 0.000297 * T + 0.000338 * T2
      : -0.00009 + 0.000084 * T + 0.000055 * T2;
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(dayNumber: number, timeZone: number): number {
  const T = (dayNumber - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const DL =
    (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) +
    0.00029 * Math.sin(3 * dr * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  let k = Math.floor((yy - 1900) * 12.3685);
  const off = jdFromDate(31, 12, yy) - 2415021;
  while (true) {
    const nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) break;
    k++;
  }
  return k;
}

/**
 * Convert Solar Date to Vietnamese Lunar Date
 */
export function convertSolar2Lunar(dd: number, mm: number, yy: number, timeZone = 7): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  let a11 = 0;
  let b11 = 0;
  let lunarMonth = 0;
  let lunarYear = yy;
  let lunarDay = 0;
  let isLeap = 0;

  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }

  lunarDay = dayNumber - monthStart + 1;

  const k11 = getLunarMonth11(yy, timeZone);
  a11 = getNewMoonDay(k11, timeZone);

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getNewMoonDay(getLunarMonth11(yy - 1, timeZone), timeZone);
    b11 = monthStart;
  } else {
    lunarYear = yy + 1;
    b11 = getNewMoonDay(getLunarMonth11(yy, timeZone), timeZone);
  }

  const offset = Math.round((monthStart - a11) / 29.530588853);
  let leapMonthDiff = 0;
  if (b11 - a11 > 365) {
    // Leap year
    const leapMonth = getLeapMonthOffset(a11, timeZone);
    if (offset >= leapMonth) {
      lunarMonth = offset - 1;
      if (offset === leapMonth) {
        isLeap = 1;
      }
    } else {
      lunarMonth = offset;
    }
  } else {
    lunarMonth = offset;
  }

  lunarMonth = (lunarMonth + 10) % 12 + 1;
  if (lunarMonth === 11 || lunarMonth === 12) {
    lunarYear--;
  }

  const yearCan = CAN[(lunarYear + 6) % 10];
  const yearChi = CHI[(lunarYear + 8) % 12];

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: isLeap,
    yearName: `${yearCan} ${yearChi}`,
  };
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k, timeZone), timeZone);
  while (true) {
    last = arc;
    k++;
    arc = getSunLongitude(getNewMoonDay(k, timeZone), timeZone);
    if (arc === last) {
      return i;
    }
    i++;
    if (i > 14) break;
  }
  return 0;
}

/**
 * Helper to get formatted Lunar text for a date string (YYYY-MM-DD or Date object)
 */
export function getLunarDateInfo(dateInput: string | Date): {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeap: boolean;
  isFirstDay: boolean;   // Ngày mùng 1
  isFullMoon: boolean;   // Ngày Rằm 15
  shortText: string;     // e.g. "1/8" or "15/8" or "11"
  fullText: string;      // e.g. "11/08 ÂL (Bính Ngọ)"
  specialEvent?: string; // e.g. "Mùng 1", "Tết Trung Thu", "Tết Nguyên Đán"
} {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const solarDay = d.getDate();
  const solarMonth = d.getMonth() + 1;
  const solarYear = d.getFullYear();

  const lunar = convertSolar2Lunar(solarDay, solarMonth, solarYear, 7);
  const isFirstDay = lunar.day === 1;
  const isFullMoon = lunar.day === 15;

  let specialEvent: string | undefined;
  if (lunar.month === 1 && lunar.day === 1) specialEvent = 'Tết Nguyên Đán';
  else if (lunar.month === 1 && lunar.day === 15) specialEvent = 'Tết Nguyên Tiêu';
  else if (lunar.month === 8 && lunar.day === 15) specialEvent = 'Tết Trung Thu';
  else if (lunar.month === 5 && lunar.day === 5) specialEvent = 'Tết Đoan Ngọ';
  else if (isFirstDay) specialEvent = 'Mùng 1';
  else if (isFullMoon) specialEvent = 'Ngày Rằm';

  const shortText =
    isFirstDay || isFullMoon || lunar.day === 1
      ? `${lunar.day}/${lunar.month}`
      : `${lunar.day}`;

  const fullText = `${lunar.day}/${lunar.month < 10 ? `0${lunar.month}` : lunar.month} ÂL${
    lunar.yearName ? ` (${lunar.yearName})` : ''
  }`;

  return {
    lunarDay: lunar.day,
    lunarMonth: lunar.month,
    lunarYear: lunar.year,
    isLeap: lunar.leap === 1,
    isFirstDay,
    isFullMoon,
    shortText,
    fullText,
    specialEvent,
  };
}
