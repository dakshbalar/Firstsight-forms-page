/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import FirstAiLogo from './FirstAiLogo';

interface FooterProps {
  onOpenAdmin: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main_footer" className="w-full border-t border-white/[0.06] py-10 bg-black/60 mt-16 text-center select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
        {/* Crisp logo in footer */}
        <FirstAiLogo size="sm" className="opacity-70 hover:opacity-100 transition-opacity duration-300" />

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[11px] font-mono tracking-wider text-[#52525B] mt-2">
          <span>&copy; {currentYear} FIRST AI. ALL RIGHTS RESERVED.</span>
          <span className="hidden sm:inline text-white/5">|</span>
          <span className="font-sans">PREMIUM AD CONVERSION EXPERIENCE</span>
          <span className="hidden sm:inline text-white/5">|</span>
          {/* Subtle discrete button to launch Admin lead management database */}
          <button
            id="footer_admin_link"
            onClick={onOpenAdmin}
            className="text-[#52525B] hover:text-brand-yellow font-mono transition-colors focus:underline outline-none text-[10px] uppercase font-bold tracking-widest cursor-pointer"
          >
            Access Lead Logs
          </button>
        </div>
      </div>
    </footer>
  );
}
