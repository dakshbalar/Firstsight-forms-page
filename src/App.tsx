/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MainCard from './components/MainCard';
import TrustSection from './components/TrustSection';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { Sparkles, ShieldCheck, Heart, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  color: string;
}

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // 1. Hardware accelerated cursor tracking for premium luxury lighting
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Trigger floating celebration particles on submission success
  const handleSubmissionSuccess = () => {
    setShowCelebration(true);
    const newParticles: Particle[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i + Date.now(),
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 150,
      y: window.innerHeight / 2,
      size: Math.random() * 8 + 4,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 6 + 4,
      color: Math.random() > 0.4 ? '#FFC400' : '#FFFFFF',
    }));

    setParticles(newParticles);

    // Stop celebration after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setParticles([]);
    }, 5000);
  };

  // Animate particles in a physics loop
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => {
            const nextX = p.x + Math.cos(p.angle) * p.speed;
            const nextY = p.y + Math.sin(p.angle) * p.speed + 0.8; // Gravity drift
            return {
              ...p,
              x: nextX,
              y: nextY,
              speed: p.speed * 0.98, // Drag decelerator
            };
          })
          .filter(p => p.y < window.innerHeight && p.x > 0 && p.x < window.innerWidth)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles]);

  const toggleAdmin = () => {
    setIsAdminOpen(!isAdminOpen);
    // Auto scroll down to admin dashboard if opened
    if (!isAdminOpen) {
      setTimeout(() => {
        document.getElementById('admin_portal_container')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div id="first_ai_page_wrapper" className="min-h-screen bg-[#050505] text-white relative flex flex-col justify-between selection:bg-brand-yellow/30 antialiased font-sans overflow-hidden">
      
      {/* Premium subtle grain overlay for organic luxury texture */}
      <div className="noise-overlay" />

      {/* Floating radial cursor glow (Size: ~350px) */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block"
        style={{
          background: 'radial-gradient(circle 350px at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 196, 0, 0.05), transparent 85%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Real-time floating celebration particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none rounded-full z-50 transition-opacity"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: p.color === '#FFC400' ? '0 0 10px rgba(255, 196, 0, 0.6)' : 'none',
          }}
        />
      ))}

      {/* Sticky Header */}
      <Header onOpenAdmin={toggleAdmin} isAdminActive={isAdminOpen} />

      {/* Ambient glowing halos in background corners */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft yellow ambient glow in top left and right corners */}
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-brand-yellow/[0.04] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-[15%] -right-[10%] w-[50%] h-[50%] bg-brand-yellow/[0.04] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-brand-yellow/[0.03] rounded-full blur-[160px] pointer-events-none" />
        
        {/* Subtle vignette layer */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,#000000_100%] opacity-70 pointer-events-none" />

        {/* Cyber Grid Lines for tech luxury depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_65%,transparent_100%)]" />
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <main id="primary_page_container" className="flex-grow pt-36 pb-16 px-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isAdminOpen ? (
            /* CONVERSION LANDING CONTAINER */
            <motion.div
              key="landing-page-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Core Centered Form Card */}
              <MainCard onSubmissionSuccess={handleSubmissionSuccess} />

              {/* Grid of 3 trust cards directly below the form */}
              <TrustSection />
            </motion.div>
          ) : (
            /* SECURE LEAD MANAGER DASHBOARD CONTAINER */
            <motion.div
              key="admin-page-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <AdminPanel onClose={toggleAdmin} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimalist Footer */}
      <Footer onOpenAdmin={toggleAdmin} />
    </div>
  );
}

