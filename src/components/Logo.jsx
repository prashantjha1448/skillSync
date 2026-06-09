import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const LogoIcon = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo-600 */}
          <stop offset="50%" stopColor="#8B5CF6" /> {/* Violet-500 */}
          <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan-500 */}
        </linearGradient>
      </defs>
      
      {/* 
        This path represents the stylized snaking 'S' / 'E' shape
        It winds back and forth with rounded caps and joints.
      */}
      <path 
        d="M 80 20 L 35 20 C 25 20, 20 25, 20 35 C 20 45, 25 50, 35 50 L 65 50 C 75 50, 80 55, 80 65 C 80 75, 75 80, 65 80 L 20 80" 
        stroke="url(#logoGradient)" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Decorative Dots matching the design */}
      <circle cx="80" cy="20" r="8" fill="#4F46E5" />
      <circle cx="20" cy="50" r="8" fill="#06B6D4" />
      <circle cx="80" cy="80" r="8" fill="#8B5CF6" />
    </svg>
  );
};

const Logo = ({ showText = true, className = "w-8 h-8", textClassName = "text-xl" }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-2 select-none">
      <LogoIcon className={className} />
      {showText && (
        <span className={`font-extrabold tracking-tight ${textClassName} ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          SkillSync
        </span>
      )}
    </div>
  );
};

export default Logo;
