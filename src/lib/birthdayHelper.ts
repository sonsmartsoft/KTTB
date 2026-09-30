import { Child, MotherSettings } from '@/domain/types';

export interface FamilyBirthdayMember {
  id: string;
  role: 'mother' | 'child';
  name: string;
  nickname: string;
  dateOfBirth?: string; // YYYY-MM-DD
  birthYear?: number;
  avatarUrl: string;
  color: string;
  daysUntilBirthday: number | null;
  nextBirthdayDisplay: string; // DD/MM
  fullDobDisplay: string; // DD/MM/YYYY
  turningAge: number | null;
  isBirthdayToday: boolean;
  isBirthdayWithinWeek: boolean; // 1..7 days before
}

/**
 * Tính số ngày còn lại đến sinh nhật tiếp theo từ ngày hiện tại (local time)
 */
export function calculateBirthdayStatus(
  dateOfBirth?: string,
  birthYearFallback?: number,
  referenceDate: Date = new Date()
): {
  daysUntil: number | null;
  nextBirthdayDisplay: string;
  fullDobDisplay: string;
  turningAge: number | null;
} {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return {
      daysUntil: null,
      nextBirthdayDisplay: 'Chưa cài đặt',
      fullDobDisplay: birthYearFallback ? `Năm ${birthYearFallback}` : 'Chưa cài đặt',
      turningAge: null,
    };
  }

  const [yStr, mStr, dStr] = dateOfBirth.split('-');
  const birthYear = parseInt(yStr, 10) || birthYearFallback || 2000;
  const month = parseInt(mStr, 10); // 1..12
  const day = parseInt(dStr, 10); // 1..31

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  let nextBday = new Date(today.getFullYear(), month - 1, day);
  // Handle Feb 29 on non-leap years
  if (month === 2 && day === 29 && nextBday.getMonth() !== 1) {
    nextBday = new Date(today.getFullYear(), 1, 28);
  }

  if (nextBday.getTime() < today.getTime()) {
    nextBday = new Date(today.getFullYear() + 1, month - 1, day);
    if (month === 2 && day === 29 && nextBday.getMonth() !== 1) {
      nextBday = new Date(today.getFullYear() + 1, 1, 28);
    }
  }

  const diffMs = nextBday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const turningAge = nextBday.getFullYear() - birthYear;

  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  return {
    daysUntil,
    nextBirthdayDisplay: `${dd}/${mm}`,
    fullDobDisplay: `${dd}/${mm}/${birthYear}`,
    turningAge: turningAge > 0 ? turningAge : null,
  };
}

export function buildFamilyBirthdayList(
  mother: MotherSettings,
  children: Child[],
  referenceDate: Date = new Date()
): FamilyBirthdayMember[] {
  const members: FamilyBirthdayMember[] = [];

  const mCalc = calculateBirthdayStatus(mother.date_of_birth, mother.birthYear, referenceDate);
  members.push({
    id: 'mother-profile',
    role: 'mother',
    name: mother.authorName || 'Mẹ Yêu',
    nickname: mother.nickname || mother.authorName || 'Mẹ Yêu',
    dateOfBirth: mother.date_of_birth,
    birthYear: mother.birthYear,
    avatarUrl: mother.avatarUrl || '🧘‍♀️',
    color: mother.color || '#F43F5E',
    daysUntilBirthday: mCalc.daysUntil,
    nextBirthdayDisplay: mCalc.nextBirthdayDisplay,
    fullDobDisplay: mCalc.fullDobDisplay,
    turningAge: mCalc.turningAge,
    isBirthdayToday: mCalc.daysUntil === 0,
    isBirthdayWithinWeek: mCalc.daysUntil !== null && mCalc.daysUntil >= 1 && mCalc.daysUntil <= 7,
  });

  for (const child of children) {
    const cCalc = calculateBirthdayStatus(child.date_of_birth, child.birthYear, referenceDate);
    members.push({
      id: child.id,
      role: 'child',
      name: child.name,
      nickname: child.nickname || child.name,
      dateOfBirth: child.date_of_birth,
      birthYear: child.birthYear,
      avatarUrl: child.avatar_url || 'boy',
      color: child.color || '#2563EB',
      daysUntilBirthday: cCalc.daysUntil,
      nextBirthdayDisplay: cCalc.nextBirthdayDisplay,
      fullDobDisplay: cCalc.fullDobDisplay,
      turningAge: cCalc.turningAge,
      isBirthdayToday: cCalc.daysUntil === 0,
      isBirthdayWithinWeek: cCalc.daysUntil !== null && cCalc.daysUntil >= 1 && cCalc.daysUntil <= 7,
    });
  }

  return members;
}

// Danh sách câu chúc đúng ngày sinh nhật của Mẹ
const MOTHER_BIRTHDAY_TODAY_WISHES = [
  'Chúc mừng sinh nhật {name} ({nickname})! 🎂💐 Chúc Mẹ luôn trẻ trung, rạng rỡ, giữ vững vóc dáng thon gọn và tràn ngập niềm vui bên các con yêu mỗi ngày!',
  'Happy Birthday {name}! 🌸💖 Cảm ơn Mẹ đã luôn là mặt trời ấm áp của cả gia đình. Chúc Mẹ tuổi mới thật nhiều sức khoẻ, bình an và hạnh phúc trọn vẹn!',
  'Mừng ngày đặc biệt của {name}! 👑🎉 Chúc "Nữ hoàng của gia đình" luôn xinh đẹp, tràn đầy năng lượng tích cực và mọi điều ước đều thành hiện thực!',
];

// Danh sách câu chúc đúng ngày sinh nhật của Con
const CHILD_BIRTHDAY_TODAY_WISHES = [
  'Chúc mừng sinh nhật tuổi {age} của {name} ({nickname})! 🎂🎈 Chúc con luôn mạnh khoẻ, chăm ngoan, học thật giỏi và mỗi ngày đến trường đều là một ngày vui!',
  'Happy Birthday {name} yêu quý! 🎉🌟 Bước sang tuổi {age}, chúc con luôn tự tin tỏa sáng, đạt thật nhiều hoa điểm tốt và giữ mãi nụ cười rạng rỡ trên môi!',
  'Mừng sinh nhật {nickname} tròn {age} tuổi! 🎁🚀 Bố Mẹ chúc con luôn tràn đầy ước mơ, ham học hỏi và lớn lên thật hạnh phúc trong vòng tay yêu thương của cả nhà!',
];

// Danh sách câu chúc đếm ngược trước 1 tuần (1 -> 7 ngày trước sinh nhật)
export function getBirthdayBannerMessage(
  member: FamilyBirthdayMember,
  wishOffset: number = 0
): {
  badge: string;
  headline: string;
  wishText: string;
} {
  const ageText = member.turningAge ? `${member.turningAge}` : 'mới';

  // 1. ĐÚNG NGÀY SINH NHẬT HÔM NAY (daysUntil === 0)
  if (member.isBirthdayToday) {
    if (member.role === 'mother') {
      const template =
        MOTHER_BIRTHDAY_TODAY_WISHES[
          Math.abs(wishOffset) % MOTHER_BIRTHDAY_TODAY_WISHES.length
        ];
      return {
        badge: `🎂 HÔM NAY LÀ SINH NHẬT CỦA MẸ (${member.nextBirthdayDisplay})`,
        headline: `Chúc Mừng Sinh Nhật ${member.name}! 🎉💐`,
        wishText: template
          .replace(/\{name\}/g, member.name)
          .replace(/\{nickname\}/g, member.nickname),
      };
    } else {
      const template =
        CHILD_BIRTHDAY_TODAY_WISHES[
          Math.abs(wishOffset) % CHILD_BIRTHDAY_TODAY_WISHES.length
        ];
      return {
        badge: `🎂 HÔM NAY LÀ SINH NHẬT CỦA ${member.nickname.toUpperCase()} (${member.nextBirthdayDisplay})`,
        headline: `Chúc Mừng Sinh Nhật ${member.name} Tròn ${ageText} Tuổi! 🎈🎉`,
        wishText: template
          .replace(/\{name\}/g, member.name)
          .replace(/\{nickname\}/g, member.nickname)
          .replace(/\{age\}/g, ageText),
      };
    }
  }

  // 2. TRƯỚC SINH NHẬT 1 TUẦN (1 <= daysUntil <= 7)
  const days = member.daysUntilBirthday ?? 1;
  const dayLabel = days === 1 ? 'Ngày mai' : `Còn ${days} ngày nữa`;

  if (member.role === 'mother') {
    const preWishes = [
      `🎉 ${dayLabel} (${member.nextBirthdayDisplay}) là đến ngày sinh nhật của ${member.name}! Cả nhà cùng chuẩn bị những món quà và lời chúc ngọt ngào nhất dành tặng Mẹ yêu nhé! 💝🌷`,
      `🌸 Tuần lễ mừng sinh nhật ${member.name} đã bắt đầu! Chỉ còn ${days} ngày nữa thôi — chúc Mẹ tuần này thật nhiều năng lượng, ăn ngon tập khoẻ để đón tuổi mới thật rạng rỡ! ✨💖`,
      `💐 Đếm ngược ${days} ngày tới sinh nhật của ${member.nickname} (${member.nextBirthdayDisplay})! Các con hãy giành thật nhiều điểm tốt và lời khen để làm quà tặng Mẹ nhé! 🎁⭐`,
    ];
    return {
      badge: `🎈 SẮP ĐẾN SINH NHẬT MẸ • ${dayLabel.toUpperCase()} (${member.nextBirthdayDisplay})`,
      headline: `Đếm ngược ${days} ngày đón Sinh Nhật ${member.name}! 💝`,
      wishText: preWishes[(days + Math.abs(wishOffset)) % preWishes.length],
    };
  } else {
    const preWishes = [
      `🎈 ${dayLabel} (${member.nextBirthdayDisplay}) là đến sinh nhật lần thứ ${ageText} của ${member.name} (${member.nickname})! Chúc con một tuần lễ đón tuổi mới thật háo hức, vui vẻ và đạt nhiều thành tích tốt! 🎁🌟`,
      `🎉 Tuần lễ sinh nhật của ${member.nickname} đã tới rồi! Chỉ còn ${days} ngày nữa con bước sang tuổi ${ageText} — cả nhà đang chờ đón ngày đặc biệt của con! 🎂💫`,
      `🌟 Đếm ngược ${days} ngày tới sinh nhật ${member.name} (${member.nextBirthdayDisplay})! Chúc con tuần này học tập thật hứng khởi để đón tiệc sinh nhật thật vui bên gia đình! 🎈🏆`,
    ];
    return {
      badge: `🎈 SẮP ĐẾN SINH NHẬT ${member.nickname.toUpperCase()} • ${dayLabel.toUpperCase()} (${member.nextBirthdayDisplay})`,
      headline: `Chỉ còn ${days} ngày nữa là Sinh Nhật ${member.name}! 🎁`,
      wishText: preWishes[(days + Math.abs(wishOffset)) % preWishes.length],
    };
  }
}

// 3. DANH SÁCH CÂU CHÚC MỖI NGÀY (Khi ngày thường không có sinh nhật trong 7 ngày tới)
export const DAILY_FAMILY_WISHES: {
  category: string;
  emoji: string;
  text: string;
}[] = [
  {
    category: 'Năng lượng ngày mới',
    emoji: '🌞',
    text: 'Chúc Mẹ và các con một ngày mới tràn đầy năng lượng, nụ cười rạng rỡ và hoàn thành xuất sắc mọi mục tiêu hôm nay!',
  },
  {
    category: 'Góc học tập của con',
    emoji: '📚',
    text: 'Mỗi trang sách mở ra là một chân trời mới. Chúc hai con hôm nay học tập thật tập trung, tự tin phát biểu và gặt hái nhiều niềm vui ở trường!',
  },
  {
    category: 'Sức khoẻ & Vóc dáng của Mẹ',
    emoji: '🧘‍♀️',
    text: 'Chúc Mẹ yêu hôm nay giữ vững kỷ luật bữa ăn healthy, uống đủ 2 lít nước và có buổi tập luyện thật sảng khoái!',
  },
  {
    category: 'Yêu thương gia đình',
    emoji: '💖',
    text: 'Gia đình là nơi bắt đầu của mọi yêu thương. Chúc cả nhà mình hôm nay có bữa cơm tối thật ấm áp và ngập tràn tiếng cười!',
  },
  {
    category: 'Kiên trì mỗi ngày',
    emoji: '🌱',
    text: 'Không cần phải giỏi ngay từ đầu, chỉ cần mỗi ngày cố gắng hơn hôm qua 1% là Mẹ và các con đã tiến rất xa rồi!',
  },
  {
    category: 'Khích lệ tinh thần',
    emoji: '🌟',
    text: 'Chúc các con luôn giữ trái tim tò mò, lễ phép với thầy cô, yêu thương bạn bè và tự hào về những nỗ lực của chính mình!',
  },
  {
    category: 'Chăm sóc bản thân',
    emoji: '🌸',
    text: 'Mẹ khỏe đẹp, hạnh phúc chính là món quà quý giá nhất của cả gia đình. Chúc Mẹ một ngày làm việc nhẹ nhàng và nhiều niềm vui!',
  },
  {
    category: 'Thói quen tốt',
    emoji: '⏰',
    text: 'Ăn sáng đầy đủ, đi học đúng giờ, tập thể dục đều đặn — những thói quen nhỏ mỗi ngày tạo nên thành công lớn cho cả gia đình!',
  },
  {
    category: 'Lòng biết ơn',
    emoji: '🌈',
    text: 'Cảm ơn mỗi sớm mai thức dậy, cả nhà đều khỏe mạnh và bình an bên nhau. Chúc hôm nay của gia đình mình thật tuyệt vời!',
  },
  {
    category: 'Chinh phục mục tiêu',
    emoji: '🏆',
    text: 'Dù là bài kiểm tra ở lớp của con hay lộ trình 30 ngày giữ dáng của Mẹ — cả nhà mình cùng đồng hành và cổ vũ cho nhau nhé!',
  },
  {
    category: 'Niềm vui học tập',
    emoji: '🎨',
    text: 'Học tập không phải là gánh nặng mà là hành trình khám phá thế giới. Chúc các con có một ngày học thật hào hứng!',
  },
  {
    category: 'Bình an & Hạnh phúc',
    emoji: '🍀',
    text: 'Chúc đại gia đình nhỏ hôm nay gặp thật nhiều điều may mắn, mọi việc hanh thông và luôn ngập tràn yêu thương!',
  },
];

export function getDailyFamilyWish(date: Date = new Date(), offset: number = 0) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = (dayOfYear + Math.abs(offset)) % DAILY_FAMILY_WISHES.length;
  return DAILY_FAMILY_WISHES[index];
}
