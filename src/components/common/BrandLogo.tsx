import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const OFFICIAL_LOGO_URL = 'https://digitalazadi.com/wp-content/uploads/2026/03/Digital-Azadi-White-Logo-scaled.png';

const resolveAsset = (filename: string) => {
  if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/support')) {
    return `/support/${filename}`;
  }
  return `/${filename}`;
};

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  imageClassName,
  size = 'md',
  showBadge = false,
}) => {
  const [lightHasError, setLightHasError] = useState(false);
  const [darkHasError, setDarkHasError] = useState(false);

  const lightLogoSrc = resolveAsset('digital-azadi-logo-light.png');
  const darkLogoSrc = resolveAsset('digital-azadi-logo-dark.png');

  const sizeClasses = {
    sm: 'h-6 md:h-7',
    md: 'h-8 md:h-9',
    lg: 'h-10 md:h-12',
    xl: 'h-14 md:h-16',
  };

  const badgePadding = {
    sm: 'px-2.5 py-1 rounded-xl',
    md: 'px-3.5 py-1.5 rounded-2xl',
    lg: 'px-4 py-2 rounded-2xl',
    xl: 'px-6 py-3 rounded-3xl',
  };

  // Fallback vector lockup if image assets fail
  const fallbackLockup = (
    <div className={cn('inline-flex items-center gap-2 select-none', className)}>
      <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#8B5CF6]" viewBox="0 0 48 48" fill="none">
          <path d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24V28C34 29.6569 32.6569 31 31 31H30V23H34" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="13" y="22" width="4" height="8" rx="2" fill="#8B5CF6"/>
          <rect x="31" y="22" width="4" height="8" rx="2" fill="#8B5CF6"/>
        </svg>
      </div>
      <div className="flex flex-col text-left">
        <span className="font-bold text-sm text-text-pure uppercase tracking-tight">
          Digital Azadi
        </span>
        <span className="text-[10px] text-text-muted font-medium">Support Portal</span>
      </div>
    </div>
  );

  if (lightHasError && darkHasError) {
    return fallbackLockup;
  }

  const imagesContent = (
    <div className="inline-flex items-center">
      {/* Light Mode Logo: Rich dark slate text + purple hexagon */}
      {!lightHasError && (
        <img
          src={lightLogoSrc}
          alt="Digital Azadi Support"
          onError={() => setLightHasError(true)}
          className={cn(
            sizeClasses[size],
            'w-auto object-contain transition-transform duration-200 select-none block dark:hidden drop-shadow-sm',
            imageClassName
          )}
          loading="eager"
        />
      )}

      {/* Dark Mode Logo: Pure white text + purple hexagon */}
      {!darkHasError && (
        <img
          src={darkLogoSrc}
          alt="Digital Azadi Support"
          onError={() => setDarkHasError(true)}
          className={cn(
            sizeClasses[size],
            'w-auto object-contain transition-transform duration-200 select-none hidden dark:block drop-shadow-sm',
            imageClassName
          )}
          loading="eager"
        />
      )}

      {/* Fallback if one failed */}
      {lightHasError && (
        <img
          src={OFFICIAL_LOGO_URL}
          alt="Digital Azadi Support"
          className={cn(
            sizeClasses[size],
            'w-auto object-contain transition-transform duration-200 select-none block dark:hidden [filter:invert(1)_hue-rotate(180deg)]',
            imageClassName
          )}
        />
      )}
      {darkHasError && (
        <img
          src={OFFICIAL_LOGO_URL}
          alt="Digital Azadi Support"
          className={cn(
            sizeClasses[size],
            'w-auto object-contain transition-transform duration-200 select-none hidden dark:block',
            imageClassName
          )}
        />
      )}
    </div>
  );

  if (showBadge) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-150',
          badgePadding[size],
          className
        )}
      >
        {imagesContent}
      </div>
    );
  }

  return <div className={cn('inline-flex items-center', className)}>{imagesContent}</div>;
};
