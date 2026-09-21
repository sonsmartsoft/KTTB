import React from 'react';

export interface MascotBoyProps {
  className?: string;
  size?: number;
}

export const MascotBoy: React.FC<MascotBoyProps> = ({ className = '', size = 110 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Desk surface */}
      <ellipse cx="80" cy="142" rx="72" ry="12" fill="#E2E8F0" />
      <rect x="25" y="130" width="110" height="12" rx="4" fill="#CBD5E1" />

      {/* Books on desk */}
      <rect x="42" y="118" width="76" height="14" rx="3" fill="#3B82F6" />
      <rect x="45" y="112" width="70" height="8" rx="2" fill="#F59E0B" />
      <rect x="48" y="106" width="64" height="7" rx="2" fill="#10B981" />

      {/* Boy Body - Blue Hoodie */}
      <path d="M46 120 C46 88 114 88 114 120 Z" fill="#2563EB" />
      <path d="M72 96 L80 108 L88 96 Z" fill="#F8FAFC" />

      {/* Boy Head */}
      <circle cx="80" cy="65" r="32" fill="#FED7AA" />
      
      {/* Hair */}
      <path
        d="M48 65 C48 38 70 30 80 30 C90 30 112 38 112 65 C108 55 96 46 80 46 C64 46 52 55 48 65 Z"
        fill="#451A03"
      />
      <path d="M50 56 C56 46 68 40 82 40 C94 40 104 46 110 56 C105 50 95 47 82 47 C68 47 56 50 50 56 Z" fill="#78350F" />

      {/* Ears */}
      <circle cx="48" cy="66" r="6" fill="#FED7AA" />
      <circle cx="112" cy="66" r="6" fill="#FED7AA" />

      {/* Cheerful Eyes */}
      <ellipse cx="68" cy="64" rx="4" ry="5" fill="#1E293B" />
      <ellipse cx="92" cy="64" rx="4" ry="5" fill="#1E293B" />
      <circle cx="70" cy="62" r="1.5" fill="#FFFFFF" />
      <circle cx="94" cy="62" r="1.5" fill="#FFFFFF" />

      {/* Cheeks */}
      <circle cx="60" cy="71" r="5" fill="#FCA5A5" opacity="0.6" />
      <circle cx="100" cy="71" r="5" fill="#FCA5A5" opacity="0.6" />

      {/* Big Smile */}
      <path d="M72 73 Q80 82 88 73" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Raised Arm with Pencil */}
      <path d="M106 102 C116 94 122 84 124 76" stroke="#FED7AA" strokeWidth="9" strokeLinecap="round" />
      {/* Pencil */}
      <g transform="translate(120, 60) rotate(-35)">
        <rect x="0" y="0" width="7" height="24" rx="1.5" fill="#F59E0B" />
        <polygon points="0,0 7,0 3.5,-7" fill="#FED7AA" />
        <polygon points="2,-4 5,-4 3.5,-7" fill="#1E293B" />
        <rect x="0" y="22" width="7" height="4" fill="#EC4899" />
      </g>
    </svg>
  );
};
