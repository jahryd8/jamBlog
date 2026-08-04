import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface CosmicBackgroundProps {
  children: React.ReactNode;
}

export default function CosmicBackground({ children }: CosmicBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-500 ${
      isDark ? 'bg-[#0B0C10] text-[#E0E6ED]' : 'bg-[#FDFBF7] text-[#1A1A1A]'
    }`}>
      {/* Dark Mode Galaxy Accents */}
      {isDark ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[140px] animate-nebula" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-950/30 rounded-full blur-[160px] animate-nebula" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 via-amber-400/20 to-transparent" />
        </div>
      ) : (
        /* Light Mode Solar / Dawn Ambient Glows */
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none opacity-70">
          <div className="absolute -top-24 -right-24 w-[550px] h-[550px] bg-amber-200/35 rounded-full blur-[130px]" />
          <div className="absolute top-1/2 -left-32 w-[450px] h-[450px] bg-orange-100/40 rounded-full blur-[140px]" />
          <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[150px]" />
        </div>
      )}

      {/* Page Content */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}