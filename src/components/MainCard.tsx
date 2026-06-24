/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Send,
  RotateCcw,
  Users,
  Check,
  Briefcase,
  Laptop,
  Building,
  Rocket,
  HelpCircle,
  Clock,
  Lock,
  Globe,
  Tag,
} from 'lucide-react';
import { LeadFormData, ValidationErrors, Interest, Occupation, ExperienceLevel } from '../types';
import { addLeadSubmission, getOccupationLabel, getExperienceLabel, getInterestLabel } from '../utils/storage';

const LOCAL_STORAGE_DRAFT_KEY = 'first_ai_form_draft_luxury';

const initialFormState: LeadFormData = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  websiteUrl: '',
  occupation: '',
  experienceLevel: '',
  interests: [],
};

const INTERESTS_OPTIONS: { id: Interest; label: string; desc: string }[] = [
  { id: 'service_perf_marketing', label: 'Performance Marketing', desc: 'Scale Meta, Instagram & Google Ads to maximize return on ad spend (ROAS).' },
  { id: 'service_marketplace', label: 'Marketplace Growth', desc: 'Boost organic rankings & run optimized ads on Amazon, Flipkart, Myntra, Nykaa.' },
  { id: 'service_shopify_dev', label: 'Shopify Store Development', desc: 'Build modern, mobile-first Shopify storefronts optimized for speed and conversion.' },
  { id: 'service_seo_organic', label: 'SEO & Organic Growth', desc: 'Drive high-quality, high-intent free search traffic to your e-commerce website.' },
  { id: 'service_brand_creative', label: 'Creative & Video Ads', desc: 'Design high-converting catalog layouts, lifestyle imagery, and viral-ready video ads.' },
  { id: 'service_automation', label: 'Marketing & Retention Automation', desc: 'Automate cart recovery, custom loyalty rewards, and retention loops via Email/WhatsApp.' },
];

const OCCUPATION_OPTIONS: { id: Occupation; label: string; icon: any }[] = [
  { id: 'brand_shopify', label: 'D2C Brand (Shopify/Woo)', icon: Laptop },
  { id: 'brand_amazon', label: 'Marketplace Seller', icon: Tag },
  { id: 'brand_retail', label: 'Retail / Offline Brand', icon: Building },
  { id: 'brand_startup', label: 'Pre-launch Brand', icon: Rocket },
  { id: 'brand_agency', label: 'Agency Partner', icon: Users },
  { id: 'brand_other', label: 'Other Business Model', icon: HelpCircle },
];

const REVENUE_OPTIONS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'rev_early', label: 'Early Stage', desc: '< ₹5 Lakhs /mo' },
  { id: 'rev_growing', label: 'Growing Stage', desc: '₹5 - ₹20 Lakhs /mo' },
  { id: 'rev_scale', label: 'Scale Stage', desc: '₹20 - ₹50 Lakhs /mo' },
  { id: 'rev_enterprise', label: 'Enterprise Stage', desc: '₹50 Lakhs+ /mo' },
];

export default function MainCard({ onSubmissionSuccess }: { onSubmissionSuccess: () => void }) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<LeadFormData>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 1. Auto-save form draft state
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }, []);

  useEffect(() => {
    if (!submittedLeadId) {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, submittedLeadId]);

  // 2. Form Validations
  const validateField = (name: keyof LeadFormData, value: any): string => {
    switch (name) {
      case 'fullName':
        if (!value || String(value).trim().length < 2) {
          return 'Full name is required (min 2 letters)';
        }
        return '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          return 'Work email address is required';
        } else if (!emailRegex.test(value)) {
          return 'Please provide a valid email address';
        }
        return '';
      case 'phone':
        const cleanPhone = String(value).replace(/\D/g, '');
        if (!value) {
          return 'Mobile number is required';
        } else if (cleanPhone.length < 8) {
          return 'Please enter a valid mobile number (min 8 digits)';
        }
        return '';
      case 'companyName':
        if (!value || String(value).trim().length < 2) {
          return 'Company/Brand Name is required';
        }
        return '';
      case 'websiteUrl':
        if (!value || String(value).trim().length < 4) {
          return 'Website URL/Store link is required';
        }
        return '';
      case 'occupation':
        if (!value) {
          return 'Please select your business channel category';
        }
        return '';
      case 'experienceLevel':
        if (!value) {
          return 'Please select your monthly revenue range';
        }
        return '';
      case 'interests':
        if (!Array.isArray(value) || value.length === 0) {
          return 'Please select at least one growth service';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof LeadFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: errorMsg,
      }));
    }
  };

  const handleBlur = (name: keyof LeadFormData) => {
    setFocusedField(null);
    setTouched(prev => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const isStepValid = (currentStep: number): boolean => {
    const currentErrors: ValidationErrors = {};
    let valid = true;

    if (currentStep === 1) {
      const nameErr = validateField('fullName', formData.fullName);
      const emailErr = validateField('email', formData.email);
      const phoneErr = validateField('phone', formData.phone);
      const companyErr = validateField('companyName', formData.companyName);
      const websiteErr = validateField('websiteUrl', formData.websiteUrl);

      if (nameErr) currentErrors.fullName = nameErr;
      if (emailErr) currentErrors.email = emailErr;
      if (phoneErr) currentErrors.phone = phoneErr;
      if (companyErr) currentErrors.companyName = companyErr;
      if (websiteErr) currentErrors.websiteUrl = websiteErr;

      setErrors(prev => ({ ...prev, ...currentErrors }));
      setTouched(prev => ({
        ...prev,
        fullName: true,
        email: true,
        phone: true,
        companyName: true,
        websiteUrl: true,
      }));

      valid = !nameErr && !emailErr && !phoneErr && !companyErr && !websiteErr;
    } else if (currentStep === 2) {
      const occErr = validateField('occupation', formData.occupation);
      const expErr = validateField('experienceLevel', formData.experienceLevel);
      if (occErr) currentErrors.occupation = occErr;
      if (expErr) currentErrors.experienceLevel = expErr;

      setErrors(prev => ({ ...prev, ...currentErrors }));
      setTouched(prev => ({ ...prev, occupation: true, experienceLevel: true }));

      valid = !occErr && !expErr;
    } else if (currentStep === 3) {
      const intErr = validateField('interests', formData.interests);
      if (intErr) currentErrors.interests = intErr;

      setErrors(prev => ({ ...prev, ...currentErrors }));
      setTouched(prev => ({ ...prev, interests: true }));

      valid = !intErr;
    }

    return valid;
  };

  const nextStep = () => {
    if (isStepValid(step)) {
      setStep(prev => Math.min(prev + 1, 4));
      document.getElementById('conversion_card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    document.getElementById('conversion_card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleInterest = (interestId: Interest) => {
    let updated: Interest[];
    if (formData.interests.includes(interestId)) {
      updated = formData.interests.filter(id => id !== interestId);
    } else {
      updated = [...formData.interests, interestId];
    }
    handleInputChange('interests', updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid(1) || !isStepValid(2) || !isStepValid(3)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate micro loading sequence for luxury system experience
      await new Promise(resolve => setTimeout(resolve, 1400));

      const submissionResult = await addLeadSubmission(formData);
      setSubmittedLeadId(submissionResult.id);

      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      onSubmissionSuccess();
    } catch (e) {
      console.error('Submission failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setFormData(initialFormState);
    setErrors({});
    setTouched({});
    setStep(1);
    setSubmittedLeadId(null);
  };

  const percentComplete = (step / 4) * 100;

  return (
    <div
      id="conversion_card"
      className="w-full max-w-[900px] bg-[#0B0B0B]/85 backdrop-blur-xl rounded-[32px] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-500 hover:border-brand-yellow/30 hover:shadow-[0_0_50px_rgba(255,196,0,0.06)] hover:-translate-y-0.5 group"
    >
      {/* Soft yellow radiant top lighting bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent" />

      <AnimatePresence mode="wait">
        {!submittedLeadId ? (
          /* LUXURY CONVERSION FORM CARD BODY */
          <motion.div
            key="lead-capture-form-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="p-6 sm:p-12 md:p-14"
          >
            {/* Top scale badge */}
            <div className="text-center mb-10">
              <div
                id="seats_limited_badge"
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-black border border-brand-yellow/45 text-brand-yellow text-[10px] md:text-xs font-mono font-bold rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(255,196,0,0.15)] mb-6 animate-pulse"
              >
                <span>⚡ DISCOVER YOUR GROWTH POTENTIAL</span>
              </div>

              {/* Headings strictly based on brand profile */}
              <h1 className="text-4xl sm:text-5xl md:text-[52px] font-display font-extrabold tracking-tight text-white leading-tight">
                Scale Your <span className="text-brand-yellow drop-shadow-[0_0_12px_rgba(255,196,0,0.25)]">E-Commerce</span> Sales
              </h1>
              
              <p className="text-xs sm:text-sm text-gray-400 mt-4 max-w-2xl mx-auto leading-relaxed">
                Partner with <strong>FirstSight</strong> to scale your brand. Get end-to-end performance marketing, optimized Shopify stores, marketplace growth (Amazon, Flipkart), and data-driven ad creatives.
              </p>

              {/* Horizontal Premium Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs font-medium text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-yellow stroke-[3.5]" />
                  Official Shopify Partners
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-yellow stroke-[3.5]" />
                  Marketplace Experts
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-yellow stroke-[3.5]" />
                  Performance First (ROAS)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-yellow stroke-[3.5]" />
                  Dedicated Account Team
                </span>
              </div>
            </div>

            {/* Premium Animated Progress Section */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2.5 text-xs font-mono text-[#A1A1AA]">
                <span className="text-brand-yellow font-bold uppercase tracking-wider">
                  {step === 1 && '1. CONTACT & BRAND PROFILE'}
                  {step === 2 && '2. BUSINESS CHANNEL & REVENUE'}
                  {step === 3 && '3. SERVICES & GOALS'}
                  {step === 4 && '4. CONFIRM STRATEGY INQUIRY'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Estimated Time: 45 Seconds</span>
                </div>
              </div>
              <div id="stepper_progress_bar_wrapper" className="bg-[#111111] rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                <motion.div
                  className="bg-brand-yellow h-full shadow-[0_0_10px_rgba(255,196,0,0.5)]"
                  initial={{ width: '25%' }}
                  animate={{ width: `${percentComplete}%` }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#52525B] mt-1.5">
                <span>Brand Profile</span>
                <span>Sales &amp; Revenue</span>
                <span>Services Needed</span>
                <span>Summary</span>
              </div>
            </div>

            {/* Form Fields container */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: Personal & Company Information */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="relative">
                      <div className={`relative rounded-2xl border bg-[#0B0B0B] transition-all duration-300 ${
                        focusedField === 'fullName'
                          ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,196,0,0.15)]'
                          : errors.fullName && touched.fullName
                          ? 'border-red-500/50 bg-red-500/[0.01]'
                          : 'border-white/10 hover:border-white/20'
                      }`}>
                        <label
                          htmlFor="fullName"
                          className={`absolute left-4 pointer-events-none transition-all duration-200 font-mono ${
                            focusedField === 'fullName' || formData.fullName
                              ? 'top-2 text-[10px] text-brand-yellow font-bold uppercase tracking-wider'
                              : 'top-4 text-sm text-[#A1A1AA]'
                          }`}
                        >
                          Contact Person Name
                        </label>
                        <User className="absolute right-4 top-4.5 w-4 h-4 text-[#52525B]" />
                        <input
                          type="text"
                          id="fullName"
                          value={formData.fullName}
                          onChange={e => handleInputChange('fullName', e.target.value)}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => handleBlur('fullName')}
                          placeholder={focusedField === 'fullName' ? 'e.g. Amit Sharma' : ''}
                          className="w-full pt-6 pb-2.5 px-4 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#52525B] font-medium"
                        />
                      </div>
                      {errors.fullName && touched.fullName && (
                        <p className="text-red-400 text-xs mt-1.5 ml-2 flex items-center gap-1 font-mono">⚠️ {errors.fullName}</p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="relative">
                      <div className={`relative rounded-2xl border bg-[#0B0B0B] transition-all duration-300 ${
                        focusedField === 'email'
                          ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,196,0,0.15)]'
                          : errors.email && touched.email
                          ? 'border-red-500/50 bg-red-500/[0.01]'
                          : 'border-white/10 hover:border-white/20'
                      }`}>
                        <label
                          htmlFor="email"
                          className={`absolute left-4 pointer-events-none transition-all duration-200 font-mono ${
                            focusedField === 'email' || formData.email
                              ? 'top-2 text-[10px] text-brand-yellow font-bold uppercase tracking-wider'
                              : 'top-4 text-sm text-[#A1A1AA]'
                          }`}
                        >
                          Work Email Address
                        </label>
                        <Mail className="absolute right-4 top-4.5 w-4 h-4 text-[#52525B]" />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={e => handleInputChange('email', e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => handleBlur('email')}
                          placeholder={focusedField === 'email' ? 'amit@brand.com' : ''}
                          className="w-full pt-6 pb-2.5 px-4 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#52525B] font-medium"
                        />
                      </div>
                      {errors.email && touched.email && (
                        <p className="text-red-400 text-xs mt-1.5 ml-2 flex items-center gap-1 font-mono">⚠️ {errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <div className="relative">
                      <div className={`relative rounded-2xl border bg-[#0B0B0B] transition-all duration-300 ${
                        focusedField === 'companyName'
                          ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,196,0,0.15)]'
                          : errors.companyName && touched.companyName
                          ? 'border-red-500/50 bg-red-500/[0.01]'
                          : 'border-white/10 hover:border-white/20'
                      }`}>
                        <label
                          htmlFor="companyName"
                          className={`absolute left-4 pointer-events-none transition-all duration-200 font-mono ${
                            focusedField === 'companyName' || formData.companyName
                              ? 'top-2 text-[10px] text-brand-yellow font-bold uppercase tracking-wider'
                              : 'top-4 text-sm text-[#A1A1AA]'
                          }`}
                        >
                          Company / Brand Name
                        </label>
                        <Building className="absolute right-4 top-4.5 w-4 h-4 text-[#52525B]" />
                        <input
                          type="text"
                          id="companyName"
                          value={formData.companyName}
                          onChange={e => handleInputChange('companyName', e.target.value)}
                          onFocus={() => setFocusedField('companyName')}
                          onBlur={() => handleBlur('companyName')}
                          placeholder={focusedField === 'companyName' ? 'e.g. SnackByte Foods' : ''}
                          className="w-full pt-6 pb-2.5 px-4 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#52525B] font-medium"
                        />
                      </div>
                      {errors.companyName && touched.companyName && (
                        <p className="text-red-400 text-xs mt-1.5 ml-2 flex items-center gap-1 font-mono">⚠️ {errors.companyName}</p>
                      )}
                    </div>

                    {/* Website URL */}
                    <div className="relative">
                      <div className={`relative rounded-2xl border bg-[#0B0B0B] transition-all duration-300 ${
                        focusedField === 'websiteUrl'
                          ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,196,0,0.15)]'
                          : errors.websiteUrl && touched.websiteUrl
                          ? 'border-red-500/50 bg-red-500/[0.01]'
                          : 'border-white/10 hover:border-white/20'
                      }`}>
                        <label
                          htmlFor="websiteUrl"
                          className={`absolute left-4 pointer-events-none transition-all duration-200 font-mono ${
                            focusedField === 'websiteUrl' || formData.websiteUrl
                              ? 'top-2 text-[10px] text-brand-yellow font-bold uppercase tracking-wider'
                              : 'top-4 text-sm text-[#A1A1AA]'
                          }`}
                        >
                          Website URL / Store Link
                        </label>
                        <Globe className="absolute right-4 top-4.5 w-4 h-4 text-[#52525B]" />
                        <input
                          type="text"
                          id="websiteUrl"
                          value={formData.websiteUrl}
                          onChange={e => handleInputChange('websiteUrl', e.target.value)}
                          onFocus={() => setFocusedField('websiteUrl')}
                          onBlur={() => handleBlur('websiteUrl')}
                          placeholder={focusedField === 'websiteUrl' ? 'e.g. snackbyte.co' : ''}
                          className="w-full pt-6 pb-2.5 px-4 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#52525B] font-medium"
                        />
                      </div>
                      {errors.websiteUrl && touched.websiteUrl && (
                        <p className="text-red-400 text-xs mt-1.5 ml-2 flex items-center gap-1 font-mono">⚠️ {errors.websiteUrl}</p>
                      )}
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="relative">
                    <div className={`relative rounded-2xl border bg-[#0B0B0B] transition-all duration-300 ${
                      focusedField === 'phone'
                        ? 'border-brand-yellow shadow-[0_0_15px_rgba(255,196,0,0.15)]'
                        : errors.phone && touched.phone
                        ? 'border-red-500/50 bg-red-500/[0.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}>
                      <label
                        htmlFor="phone"
                        className={`absolute left-4 pointer-events-none transition-all duration-200 font-mono ${
                          focusedField === 'phone' || formData.phone
                            ? 'top-2 text-[10px] text-brand-yellow font-bold uppercase tracking-wider'
                            : 'top-4 text-sm text-[#A1A1AA]'
                        }`}
                      >
                        WhatsApp / Contact Number
                      </label>
                      <Smartphone className="absolute right-4 top-4.5 w-4 h-4 text-[#52525B]" />
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => handleBlur('phone')}
                        placeholder={focusedField === 'phone' ? 'e.g. +91 98765 43210' : ''}
                        className="w-full pt-6 pb-2.5 px-4 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#52525B] font-medium"
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p className="text-red-400 text-xs mt-1.5 ml-2 flex items-center gap-1 font-mono">⚠️ {errors.phone}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Sales Channel & Revenue Selection */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Part A: Primary Sales Channel */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-xs font-mono uppercase text-[#A1A1AA] tracking-wider font-semibold">Primary Sales Channel</span>
                      <span className="text-[10px] text-brand-yellow font-mono italic">Choose One Option</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {OCCUPATION_OPTIONS.map(role => {
                        const isSelected = formData.occupation === role.id;
                        const IconComponent = role.icon;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleInputChange('occupation', role.id)}
                            className={`p-3 rounded-[18px] border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[95px] group/item ${
                              isSelected
                                ? 'border-brand-yellow bg-brand-yellow/[0.06] text-white shadow-[0_0_20px_rgba(255,196,0,0.12)]'
                                : 'border-white/10 bg-[#0B0B0B] text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                              isSelected
                                ? 'bg-brand-yellow text-black'
                                : 'bg-white/[0.02] text-gray-400 group-hover/item:text-brand-yellow'
                            }`}>
                              <IconComponent className="w-4 h-4 stroke-[2]" />
                            </div>
                            <span className="text-[10px] font-semibold tracking-wide font-sans leading-tight">{role.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.occupation && touched.occupation && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-mono">⚠️ {errors.occupation}</p>
                    )}
                  </div>

                  {/* Part B: Monthly Revenue Stage */}
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-xs font-mono uppercase text-[#A1A1AA] tracking-wider font-semibold">Current Monthly Sales Revenue</span>
                      <span className="text-[10px] text-brand-yellow font-mono italic">Select Revenue Stage</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {REVENUE_OPTIONS.map(rev => {
                        const isSelected = formData.experienceLevel === rev.id;
                        return (
                          <button
                            key={rev.id}
                            type="button"
                            onClick={() => handleInputChange('experienceLevel', rev.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-center ${
                              isSelected
                                ? 'border-brand-yellow bg-brand-yellow/[0.05] text-white shadow-[0_0_15px_rgba(255,196,0,0.08)]'
                                : 'border-white/10 bg-[#0B0B0B] text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <span className={`text-xs font-bold ${isSelected ? 'text-brand-yellow' : 'text-white'}`}>{rev.label}</span>
                            <span className="text-[10px] text-gray-400 mt-1">{rev.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.experienceLevel && touched.experienceLevel && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-mono">⚠️ {errors.experienceLevel}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Services Needed */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-mono uppercase text-[#A1A1AA] tracking-wider font-semibold">Select E-Commerce Services Needed</span>
                    <span className="text-[10px] text-brand-yellow font-mono italic">Select All That Apply</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {INTERESTS_OPTIONS.map(interest => {
                      const isSelected = formData.interests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          className={`p-4 rounded-[18px] border text-left transition-all duration-300 flex items-start gap-4 cursor-pointer ${
                            isSelected
                              ? 'border-brand-yellow bg-brand-yellow/[0.04] text-white shadow-[0_0_15px_rgba(255,196,0,0.08)]'
                              : 'border-white/10 bg-[#0B0B0B] text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                            isSelected
                              ? 'bg-brand-yellow border-brand-yellow text-black'
                              : 'border-white/20 bg-black'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <div>
                            <span className="block font-semibold text-xs text-white tracking-wide">{interest.label}</span>
                            <span className="block text-[11px] text-[#A1A1AA] mt-1 leading-relaxed font-sans font-normal">
                              {interest.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.interests && touched.interests && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-mono">⚠️ {errors.interests}</p>
                  )}
                </motion.div>
              )}

              {/* STEP 4: Summary Review */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <p className="text-xs text-[#A1A1AA] text-center italic font-sans">
                    Please review your business details before submitting your growth partner strategy inquiry.
                  </p>

                  <div className="bg-[#111111] rounded-2xl border border-white/10 p-5 sm:p-7 space-y-4 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pb-4 border-b border-white/5">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Contact Person</span>
                        <p className="text-sm font-semibold text-white mt-1">{formData.fullName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Work Email</span>
                        <p className="text-sm font-semibold text-white mt-1">{formData.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pb-4 border-b border-white/5">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Company / Brand</span>
                        <p className="text-sm font-semibold text-white mt-1">{formData.companyName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Website Link</span>
                        <p className="text-sm font-semibold text-white mt-1 font-mono text-brand-yellow hover:underline">{formData.websiteUrl}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pb-4 border-b border-white/5">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Mobile Number</span>
                        <p className="text-sm font-semibold text-white mt-1 font-mono">{formData.phone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold">Business Profile &amp; Sales</span>
                        <p className="text-sm font-semibold text-white mt-1">
                          {getOccupationLabel(formData.occupation)} • <span className="text-brand-yellow font-mono text-xs">{getExperienceLabel(formData.experienceLevel)}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#52525B] font-mono font-semibold block mb-2.5">Requested Growth Solutions</span>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map(int => (
                          <span
                            key={int}
                            className="bg-black border border-brand-yellow/30 text-brand-yellow text-[10px] font-semibold font-mono px-3 py-1 rounded-md shadow-sm"
                          >
                            {getInterestLabel(int)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#A1A1AA] flex items-start gap-2 leading-relaxed bg-brand-yellow/[0.02] p-4 rounded-xl border border-brand-yellow/15">
                    <Lock className="w-4 h-4 text-brand-yellow flex-shrink-0 mt-0.5" />
                    <p>
                      Your brand parameters are fully encrypted. By submitting, your e-commerce profile will be queued for auditing by our senior growth strategists.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* BUTTONS CONTROLLER */}
              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-8 gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 px-5 py-3.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.03] rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-1.5 px-7 py-3.5 bg-brand-yellow text-black hover:bg-[#FFD54F] rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all ml-auto hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,196,0,0.25)] cursor-pointer"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black hover:bg-white/90 disabled:bg-gray-600 rounded-full text-xs font-mono font-bold tracking-widest uppercase transition-all ml-auto hover:scale-[1.02] shadow-[0_4px_25_rgba(255,255,255,0.15)] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-brand-yellow rounded-full animate-spin" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Growth Request</span>
                        <Send className="w-4 h-4 text-brand-yellow" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          /* PREMIUM CONFIRMATION SUCCESS SCREEN */
          <motion.div
            key="lead-submission-success-content"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="p-8 sm:p-14 md:p-16 text-center"
          >
            {/* Draw checkmark animation */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow border border-brand-yellow/20 shadow-[0_0_30px_rgba(255,196,0,0.15)] relative">
                <svg
                  className="w-10 h-10 stroke-brand-yellow"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" className="draw-checkmark" />
                </svg>
                {/* Floating ripple ring */}
                <div className="absolute inset-0 border border-brand-yellow/30 rounded-full animate-ping opacity-25 scale-110 pointer-events-none" />
              </div>
            </div>

            <span className="font-mono text-xs text-brand-yellow font-bold bg-brand-yellow/5 border border-brand-yellow/25 px-4 py-1 rounded-full uppercase tracking-widest inline-block mb-4 shadow-[0_0_15px_rgba(255,196,0,0.1)]">
              Inquiry Received
            </span>

            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
              Growth Strategy Request Submitted!
            </h2>

            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-3 max-w-lg mx-auto leading-relaxed">
              Thank you for reaching out to <strong>FirstSight</strong>. Our e-commerce growth experts will audit your store and digital footprint to prepare a personalized performance roadmap. We will connect with you within 24 hours.
            </p>

            {/* Premium Gold Reference ID Block */}
            <div className="my-9 py-5 px-6 bg-black/60 border border-brand-yellow/20 rounded-2xl max-w-sm mx-auto text-center shadow-[inset_0_1px_8px_rgba(255,196,0,0.05)]">
              <span className="text-[10px] font-mono text-[#52525B] uppercase tracking-widest block font-bold">Request Reference ID</span>
              <strong className="text-xl sm:text-2xl font-mono text-brand-yellow font-bold block mt-1.5 tracking-wider drop-shadow-[0_0_8px_rgba(255,196,0,0.3)]">
                {submittedLeadId}
              </strong>
            </div>

            {/* Glowing CTAs */}
            <div className="space-y-4 max-w-sm mx-auto">
              <a
                href="https://wa.me/919000000000?text=Hello%20FirstSight%20Team!%20We%20just%20submitted%20a%20B2B%20growth%20strategy%20request%20with%20reference%20ID%20"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs font-mono uppercase tracking-widest rounded-full transition-all shadow-[0_4px_20px_rgba(37,211,102,0.2)] hover:scale-[1.02] duration-300 relative overflow-hidden group cursor-pointer"
              >
                <Users className="w-4 h-4 fill-white" />
                <span>Chat with Growth Expert</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
              </a>

              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-1.5 w-full py-3.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.03] font-bold text-xs font-mono uppercase tracking-widest rounded-full transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit Another Inquiry</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Security Label */}
      <div className="absolute bottom-4 right-6 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#52525B] tracking-wider uppercase">
        <Lock className="w-3 h-3 text-brand-yellow/60" />
        <span>Your business details are private &amp; secure</span>
      </div>
    </div>
  );
}
