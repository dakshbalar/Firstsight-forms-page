/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import FirstAiLogo from './FirstAiLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
  isAdminActive: boolean;
}

export default function Header({ onOpenAdmin, isAdminActive }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-5 left-0 right-0 z-40 flex justify-center px-4 transition-all duration-300">
      <header
        id="main_sticky_header"
        className={`w-[95%] max-w-7xl h-20 rounded-full border flex items-center justify-between px-6 sm:px-8 transition-all duration-400 ${
          scrolled
            ? 'bg-black/85 backdrop-blur-md border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
            : 'bg-[#0B0B0B]/70 backdrop-blur-sm border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
        }`}
      >
        {/* Left: First AI Logo */}
        <div className="flex items-center">
          <FirstAiLogo size="md" />
        </div>

        {/* Center: Navigation Menu (Home, Programs, Community) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest text-[#A1A1AA]">
          <a
            href="#home"
            className="hover:text-brand-yellow font-medium transition-colors relative py-1.5 group select-none"
          >
            HOME
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-brand-yellow transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#programs"
            className="hover:text-brand-yellow font-medium transition-colors relative py-1.5 group select-none"
          >
            PROGRAMS
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-brand-yellow transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#community"
            className="hover:text-brand-yellow font-medium transition-colors relative py-1.5 group select-none"
          >
            COMMUNITY
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-brand-yellow transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        {/* Right: Small Trust Badge & Admin Toggle */}
        <div className="flex items-center gap-3.5">
          {/* Admin Database Access Portal Button */}
          <button
            id="admin_panel_toggle_btn"
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
              isAdminActive
                ? 'bg-brand-yellow text-black font-bold shadow-[0_0_15px_rgba(255,196,0,0.4)]'
                : 'bg-white/[0.04] text-[#A1A1AA] hover:text-white border border-white/10 hover:bg-white/[0.1]'
            }`}
            title="Open Lead Database Log"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
            <span className="hidden sm:inline">{isAdminActive ? 'Lead Log' : 'Admin'}</span>
          </button>

          {/* Premium Badge: ⭐ Trusted by 1000+ Learners */}
          <div
            id="trust_badge"
            className="flex items-center gap-2 px-4 py-1.5 bg-black/60 border border-brand-yellow/30 text-brand-yellow text-xs rounded-full font-medium tracking-wide shadow-[0_0_15px_rgba(255,196,0,0.08)] select-none"
          >
            <Sparkles className="w-3.5 h-3.5 fill-brand-yellow" />
            <span className="font-semibold text-[11px] sm:text-xs">Trusted by 1000+ Learners</span>
          </div>
        </div>
      </header>
    </div>
  );
}
