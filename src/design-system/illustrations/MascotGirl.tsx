import React from 'react';

interface MascotGirlProps {
  size?: number;
  className?: string;
}

/**
 * Cute girl mascot SVG illustration for Bé Hạ Băng
 */
export const MascotGirl: React.FC<MascotGirlProps> = ({ size = 100, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mascot girl illustration"
    >
      {/* Body */}
      <ellipse cx="60" cy="98" rx="22" ry="10" fill="#FCA5A5" opacity="0.3" />
      
      {/* Dress */}
      <path d="M44 70 Q60 80 76 70 L80 100 Q60 110 40 100 Z" fill="#EC4899" />
      <path d="M44 70 Q60 80 76 70 L76 82 Q60 90 44 82 Z" fill="#F472B6" />
      
      {/* Arms */}
      <ellipse cx="38" cy="77" rx="6" ry="3.5" fill="#FDBA74" transform="rotate(-25 38 77)" />
      <ellipse cx="82" cy="77" rx="6" ry="3.5" fill="#FDBA74" transform="rotate(25 82 77)" />
      
      {/* Neck */}
      <rect x="54" y="55" width="12" height="10" rx="4" fill="#FDBA74" />
      
      {/* Head */}
      <ellipse cx="60" cy="40" rx="22" ry="22" fill="#FDDCB0" />
      
      {/* Hair - top buns */}
      <circle cx="42" cy="24" r="10" fill="#92400E" />
      <circle cx="78" cy="24" r="10" fill="#92400E" />
      {/* Hair bun highlights */}
      <circle cx="39" cy="21" r="3.5" fill="#B45309" opacity="0.6" />
      <circle cx="75" cy="21" r="3.5" fill="#B45309" opacity="0.6" />
      
      {/* Hair - framing face */}
      <path d="M38 30 Q32 38 34 50 Q36 55 40 56 L40 45 Q38 38 40 32 Z" fill="#92400E" />
      <path d="M82 30 Q88 38 86 50 Q84 55 80 56 L80 45 Q82 38 80 32 Z" fill="#92400E" />
      
      {/* Hair ribbons */}
      <circle cx="42" cy="16" r="4" fill="#F9A8D4" />
      <circle cx="78" cy="16" r="4" fill="#F9A8D4" />
      <circle cx="42" cy="16" r="2" fill="#EC4899" />
      <circle cx="78" cy="16" r="2" fill="#EC4899" />
      
      {/* Eyes */}
      <ellipse cx="52" cy="38" rx="4" ry="4.5" fill="#1E293B" />
      <ellipse cx="68" cy="38" rx="4" ry="4.5" fill="#1E293B" />
      {/* Eye sparkles */}
      <circle cx="50.5" cy="36.5" r="1.5" fill="white" />
      <circle cx="66.5" cy="36.5" r="1.5" fill="white" />
      {/* Eyelashes */}
      <path d="M48 34 Q49 32 51 33" stroke="#1E293B" strokeWidth="1" fill="none" />
      <path d="M64 34 Q65 32 67 33" stroke="#1E293B" strokeWidth="1" fill="none" />
      
      {/* Rosy cheeks */}
      <ellipse cx="44" cy="44" rx="5" ry="3.5" fill="#FCA5A5" opacity="0.6" />
      <ellipse cx="76" cy="44" rx="5" ry="3.5" fill="#FCA5A5" opacity="0.6" />
      
      {/* Smile */}
      <path d="M53 49 Q60 55 67 49" stroke="#E11D48" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Nose */}
      <ellipse cx="60" cy="44" rx="2" ry="1.5" fill="#FDBA74" />
      
      {/* Star decoration */}
      <text x="88" y="42" fontSize="12" fill="#FCD34D">⭐</text>
      <text x="20" y="52" fontSize="10" fill="#A78BFA">✨</text>
    </svg>
  );
};
