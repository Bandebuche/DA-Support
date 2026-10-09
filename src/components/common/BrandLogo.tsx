import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const OFFICIAL_LOGO_URL = 'https://digitalazadi.com/wp-content/uploads/2026/03/Digital-Azadi-White-Logo-scaled.png';
export const LOCAL_FALLBACK_LOGO_URL = './digital-azadi-logo.png';

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
  showBadge = true,
}) => {
  const [imgSrc, setImgSrc] = useState(OFFICIAL_LOGO_URL);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (imgSrc === OFFICIAL_LOGO_URL) {
      // Try local cached fallback
      setImgSrc(LOCAL_FALLBACK_LOGO_URL);
    } else {
      // If both fail, show vector fallback
      setHasError(true);
    }
  };

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

  if (hasError) {
    return (
      <div className={cn('inline-flex items-center gap-2 select-none', className)}>
        <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#8B5CF6]" viewBox="0 0 48 48" fill="none">
            <path d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24V28C34 29.6569 32.6569 31 31 31H30V23H34" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="13" y="22" width="4" height="8" rx="2" fill="#8B5CF6"/>
            <rect x="31" y="22" width="4" height="8" rx="2" fill="#8B5CF6"/>
          </svg>
        </div>
        <span className="font-mono font-bold text-sm text-text-pure uppercase">
          Digital Azadi
        </span>
      </div>
    );
  }

  const imageElement = (
    <img
      src={imgSrc}
      alt="Digital Azadi"
      onError={handleImageError}
      className={cn(
        sizeClasses[size],
        'w-auto object-contain transition-transform duration-200 select-none drop-shadow-sm',
        imageClassName
      )}
      loading="eager"
    />
  );

  if (showBadge) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center bg-slate-900 border border-slate-800 shadow-sm transition-all duration-150',
          badgePadding[size],
          className
        )}
      >
        {imageElement}
      </div>
    );
  }

  return <div className={cn('inline-flex items-center', className)}>{imageElement}</div>;
};
