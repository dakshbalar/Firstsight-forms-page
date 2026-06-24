/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface FirstAiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FirstAiLogo({ className = '', size = 'md' }: FirstAiLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Set highly professional, crisp, responsive height constraints
  const logoHeight = size === 'sm' ? 'h-6 sm:h-7' : size === 'lg' ? 'h-12 sm:h-14' : 'h-8 sm:h-9';
  const fallbackTextSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div id="first_ai_logo_wrapper" className={`flex items-center gap-2 select-none ${className}`}>
      {!imageError ? (
        <img
          src="/logo.png"
          alt="FirstSight. Logo"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`${logoHeight} w-auto object-contain transition-all duration-300 filter hover:brightness-110`}
        />
      ) : (
        /* Fallback if logo.png is not yet uploaded/accessible */
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          <span className={`font-display font-extrabold tracking-wider text-white ${fallbackTextSize}`}>
            FirstSight<span className="text-brand-yellow">.</span>
          </span>
        </div>
      )}
    </div>
  );
}

