import React from 'react';

export interface BookStackProps {
  className?: string;
  size?: number;
}

export const BookStack: React.FC<BookStackProps> = ({ className = '', size = 100 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shadow */}
      <ellipse cx="70" cy="126" rx="55" ry="10" fill="#E2E8F0" />

      {/* Book 1 (Bottom - Emerald) */}
      <rect x="20" y="104" width="96" height="18" rx="4" fill="#10B981" />
      <rect x="25" y="108" width="88" height="10" rx="2" fill="#ECFDF5" />
      <path d="M20 104 L20 122" stroke="#059669" strokeWidth="4" />

      {/* Book 2 (Middle - Pink) */}
      <rect x="28" y="88" width="84" height="17" rx="4" fill="#EC4899" />
      <rect x="33" y="92" width="76" height="9" rx="2" fill="#FDF2F8" />
      <path d="M28 88 L28 105" stroke="#DB2777" strokeWidth="4" />

      {/* Book 3 (Top - Cerulean Blue) */}
      <rect x="36" y="74" width="72" height="15" rx="4" fill="#0284C7" />
      <rect x="40" y="77" width="64" height="9" rx="2" fill="#F0F9FF" />
      <path d="M36 74 L36 89" stroke="#0369A1" strokeWidth="4" />

      {/* Pen holder Cup */}
      <rect x="66" y="38" width="34" height="38" rx="4" fill="#F59E0B" />
      <ellipse cx="83" cy="38" rx="17" ry="5" fill="#D97706" />

      {/* Pencils and Rulers inside cup */}
      {/* Ruler */}
      <rect x="70" y="16" width="6" height="30" rx="1" fill="#94A3B8" transform="rotate(-10 70 16)" />
      {/* Yellow Pencil */}
      <rect x="80" y="14" width="6" height="30" rx="1" fill="#EAB308" />
      <polygon points="80,14 86,14 83,6" fill="#FED7AA" />
      <polygon points="82,8 84,8 83,6" fill="#1E293B" />
      {/* Red Pencil */}
      <rect x="90" y="18" width="6" height="26" rx="1" fill="#EF4444" transform="rotate(15 90 18)" />
      <polygon points="90,18 96,18 93,10" fill="#FED7AA" transform="rotate(15 90 18)" />

      {/* Floating Star Decors */}
      <path d="M24 64 L26 69 L31 70 L27 74 L28 79 L24 76 L19 79 L20 74 L17 70 L22 69 Z" fill="#FBBF24" />
      <path d="M112 40 L113 44 L117 45 L114 48 L115 52 L112 50 L108 52 L109 48 L106 45 L110 44 Z" fill="#F472B6" />
    </svg>
  );
};
