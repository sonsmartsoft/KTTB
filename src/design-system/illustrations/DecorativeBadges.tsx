import React from 'react';

export const PushPin: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="7" r="5" fill="#EF4444" />
    <ellipse cx="12" cy="7" rx="4" ry="2" fill="#F87171" />
    <path d="M10 11 L14 11 L13 16 L11 16 Z" fill="#DC2626" />
    <path d="M12 16 L12 23" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SpeechBubble: React.FC<{ text: string; subtext?: string; className?: string }> = ({
  text,
  subtext,
  className = '',
}) => (
  <div className={`relative bg-white border-2 border-blue-200 rounded-2xl p-2.5 shadow-sm text-xs font-bold text-blue-900 leading-snug ${className}`}>
    <div>{text}</div>
    {subtext && <div className="text-[10px] text-blue-500 font-normal mt-0.5">{subtext}</div>}
    {/* Pointer tip */}
    <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-r-2 border-b-2 border-blue-200 transform rotate-45" />
  </div>
);

export const MotivationalRibbon: React.FC<{ text: string; subtext?: string; className?: string }> = ({
  text,
  subtext,
  className = '',
}) => (
  <div className={`relative bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md ${className}`}>
    <span>{text}</span>
    {subtext && <span className="opacity-90 ml-1 font-normal">{subtext}</span>}
  </div>
);
