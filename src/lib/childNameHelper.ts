import { Child } from '@/domain/types';

/**
 * Returns honorific prefix based on age/grade:
 * - Grade 6+ or age >= 11 or THCS/THPT: "Bạn"
 * - Grade 1-5 or Mầm non / age < 11: "Bé"
 */
export function getChildHonorific(child: Partial<Child> | null | undefined): 'Bé' | 'Bạn' {
  if (!child) return 'Bé';

  // Check birth year / date of birth if available
  const currentYear = new Date().getFullYear();
  if (child.birthYear && (currentYear - child.birthYear >= 11)) {
    return 'Bạn';
  }
  if (child.date_of_birth) {
    const y = parseInt(child.date_of_birth.slice(0, 4), 10);
    if (!isNaN(y) && (currentYear - y >= 11)) {
      return 'Bạn';
    }
  }

  // Check grade or school level string
  const gradeStr = (child.grade || '').toLowerCase();
  const schoolStr = (child.school_name || '').toLowerCase();
  const nameStr = (child.name || '').toLowerCase();

  // If name specifically includes Trung Quân
  if (nameStr.includes('trung quân')) {
    return 'Bạn';
  }

  if (
    gradeStr.includes('lớp 6') || gradeStr.includes('lớp 7') ||
    gradeStr.includes('lớp 8') || gradeStr.includes('lớp 9') ||
    gradeStr.includes('lớp 10') || gradeStr.includes('lớp 11') || gradeStr.includes('lớp 12') ||
    gradeStr.includes('thcs') || gradeStr.includes('thpt') ||
    schoolStr.includes('thcs') || schoolStr.includes('thpt')
  ) {
    return 'Bạn';
  }

  return 'Bé';
}

/**
 * Strips existing "Bé" or "Bạn" prefixes to obtain the clean raw name.
 * e.g., "Bé Trung Quân" -> "Trung Quân", "Bạn An" -> "An".
 */
export function getCleanChildName(name: string | undefined): string {
  if (!name) return '';
  return name.replace(/^(Bé|Bạn)\s+/i, '').trim();
}

/**
 * Formats full display name with appropriate honorific.
 * e.g. Trung Quân (Lớp 8) -> "Bạn Trung Quân"
 *      Hạ Băng (Mầm non) -> "Bé Hạ Băng"
 */
export function formatChildDisplayName(child: Partial<Child> | null | undefined): string {
  if (!child || !child.name) return '';
  const cleanName = getCleanChildName(child.name);
  const honorific = getChildHonorific(child);
  return `${honorific} ${cleanName}`;
}

/**
 * Formats greeting sentence
 * e.g. "Chào bạn Trung Quân!" vs "Chào bé Hạ Băng!"
 */
export function getChildGreeting(child: Partial<Child> | null | undefined): string {
  if (!child) return 'Xin chào!';
  const disp = formatChildDisplayName(child);
  return `Chào ${disp.charAt(0).toLowerCase() + disp.slice(1)}!`;
}
