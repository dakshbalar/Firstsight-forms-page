/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, Zap, Rocket } from 'lucide-react';

export default function TrustSection() {
  const cards = [
    {
      icon: <GraduationCap className="w-5 h-5 text-brand-yellow" />,
      title: 'Practical Learning',
      description: 'Learn by building real-world projects and custom workflows.',
    },
    {
      icon: <Zap className="w-5 h-5 text-brand-yellow" />,
      title: 'Latest AI Tools',
      description: 'Master prompting, agentic design, automation, and content engineering.',
    },
    {
      icon: <Rocket className="w-5 h-5 text-brand-yellow" />,
      title: 'Career Growth',
      description: 'Acquire high-leverage future-ready skills that multiply output.',
    },
  ];

  return (
    <section id="trust_section_wrapper" className="mt-12 w-full max-w-[900px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            id={`trust_card_${index}`}
            className="bg-[#0B0B0B]/70 backdrop-blur-md border border-white/[0.08] p-6 rounded-2xl shadow-lg hover:border-brand-yellow/30 hover:shadow-[0_0_25px_rgba(255,196,0,0.04)] transition-all duration-400 flex flex-col items-start gap-3 group cursor-pointer"
          >
            <div className="p-2.5 bg-[#111111] border border-white/5 rounded-xl group-hover:scale-105 transition-transform duration-300">
              {card.icon}
            </div>
            <h3 className="font-display font-semibold text-sm text-white tracking-wide">{card.title}</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
