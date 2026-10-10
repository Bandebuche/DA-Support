import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TicketFormData, 
  UserType, 
  MembershipTier, 
  ProductEcosystem, 
  Ticket,
  SupportSpecialist
} from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { loadStoredTickets } from '../../lib/storage';
import { getCurrentISTClockString, formatToISTDateTimeString } from '../../lib/timezone';
import { 
  CheckCircle, 
  Sparkles, 
  Send, 
  Clock, 
  Copy, 
  Check, 
  MessageCircle, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  Tag, 
  Search, 
  RotateCcw, 
  AlertCircle,
  MapPin,
  Award,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../ui/Badge';

const ISSUE_TAGS = [
  { tag: '+ WordPress/DNS', append: '[WordPress & DNS Error] ' },
  { tag: '+ WhatsApp WABA', append: '[WhatsApp WABA API Integration] ' },
  { tag: '+ Payment/SSL', append: '[Payment Gateway & SSL Issue] ' },
  { tag: '+ Funnel/Login', append: '[LMS Funnel & Login Access] ' },
  { tag: '+ CRM Lead Sync', append: '[Chakravyuh CRM Webhook Sync] ' },
];

const MEMBERSHIP_OPTIONS: { id: MembershipTier; label: string; badge: string; icon: string; desc: string }[] = [
  { 
    id: 'Diamond Member', 
    label: 'Diamond Member', 
    badge: 'Diamond Tier', 
    icon: '💎',
    desc: 'Highest priority SLA with direct engineer review' 
  },
  { 
    id: 'Silver Member', 
    label: 'Silver Member', 
    badge: 'Silver Tier', 
    icon: '🥈',
    desc: 'Standard technical query and setup assistance' 
  },
  { 
    id: 'Gold Member', 
    label: 'Gold Member', 
    badge: 'Gold Tier', 
    icon: '🥇',
    desc: 'Priority queue with fast technical turnaround' 
  },
  { 
    id: 'PMP Member', 
    label: 'PMP Member', 
    badge: 'PMP Professional', 
    icon: '⭐',
    desc: 'Specialized project & business mentorship support' 
  },
];

export const PublicGateway: React.FC = () => {
  const [istTime, setIstTime] = useState(getCurrentISTClockString());
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Tracking State
  const [trackTicketId, setTrackTicketId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState<TicketFormData>({
    fullName: '',
    email: '',
    mobile: '',
    city: '',
    userType: 'Student Pro',
    membershipTier: 'Diamond Member',
    ecosystem: 'Chakravyuh CRM',
    category: 'CRM & Lead Management',
    websiteUrl: '',
    subject: '',
    description: '',
    assignedSpecialist: 'Sachin Sir',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live IST Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getCurrentISTClockString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WhatsApp Validation: 10 Indian digits starting with 6-9
  const mobileDigits = formData.mobile.replace(/\D/g, '');
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileDigits);

  // Email Validation: valid email format
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isGmail = formData.email.trim().toLowerCase().endsWith('@gmail.com');

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (minimum 2 characters).';
    }
    
    if (!isMobileValid) {
      errs.mobile = 'Please enter a valid 10-digit Indian WhatsApp mobile number (starting with 6-9).';
    }
    
    if (!formData.email.trim() || !isEmailValid) {
      errs.email = 'Please enter a valid email address (e.g. yourname@gmail.com).';
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errs.city = 'Please enter your city (e.g. Pune, Mumbai, Delhi).';
    }
    
    if (!formData.subject.trim() || formData.subject.trim().length < 4) {
      errs.subject = 'Please enter an inquiry subject (minimum 4 characters).';
    }
    
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please describe your query in detail (minimum 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await ticketService.submitTicket({
        ...formData,
        mobile: formData.mobile.replace(/\D/g, ''),
      });

      setCreatedTicket(ticket);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#EC4899', '#8B5CF6', '#10B981'],
        });
      } catch {
        // Safe fallback
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.ticketId);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleAppendIssueTag = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description.startsWith(snippet) 
        ? prev.description 
        : snippet + prev.description,
    }));
  };

  const handleResetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      city: '',
      userType: 'Student Pro',
      membershipTier: 'Diamond Member',
      ecosystem: 'Chakravyuh CRM',
      category: 'CRM & Lead Management',
      websiteUrl: '',
      subject: '',
      description: '',
      assignedSpecialist: 'Sachin Sir',
    });
    setCreatedTicket(null);
    setErrors({});
  };

  // Ticket Tracker Search with Phone Verification
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedTicket(null);

    const cleanId = trackTicketId.trim().toUpperCase();
    const cleanPhone = trackPhone.replace(/\D/g, '');

    if (!cleanId) {
      setTrackError('Please enter your Ticket ID (e.g. DA-2026-XXXX).');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setTrackError('Please enter your 10-digit registered WhatsApp mobile number for verification.');
      return;
    }

    setIsSearchingTrack(true);

    try {
      const allTickets = loadStoredTickets();
      const matched = allTickets.find(t => {
        const matchesId = t.ticketId.toUpperCase() === cleanId;
        const matchesPhone = t.requesterPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10));
        return matchesId && matchesPhone;
      });

      if (matched) {
        setTrackedTicket(matched);
      } else {
        const idExists = allTickets.some(t => t.ticketId.toUpperCase() === cleanId);
        if (idExists) {
          setTrackError('Ticket ID found, but the mobile number does not match our records for this ticket. Please verify your 10-digit registered number.');
        } else {
          setTrackError(`No record found for Ticket ID "${cleanId}". Please verify your ticket ID or raise a new support query.`);
        }
      }
    } catch (err: any) {
      setTrackError('Error checking records: ' + err.message);
    } finally {
      setIsSearchingTrack(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-[#0A0D1B] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-pink-500 selection:text-white relative overflow-hidden font-sans transition-colors duration-200">
      
      {/* Ambient Cosmic Radial Glows */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-pink-500/10 dark:bg-pink-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        
        {/* Brand Identity & Clearly Visible Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showBadge={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Digital Azadi Support
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                Official Helpdesk
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Student & Franchise Resolution Center • Live in IST
            </p>
          </div>
        </div>

        {/* Center / Right Header Controls */}
        <div className="flex items-center gap-3">
          
          {/* Live IST Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-md text-xs font-mono shadow-xs dark:shadow-inner text-slate-800 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{istTime}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">IST</span>
          </div>

          {/* Light / Dark Mode Icon Toggle ONLY (Admin Login Removed as requested) */}
          <ThemeToggle className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white shadow-sm hover:scale-105 active:scale-95 transition-all" />

        </div>

      </header>

      {/* Main Form Centerpiece (Single Centered Glass Card) */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col justify-center">
        
        {/* Rounded Glassmorphic Master Card */}
        <div className="w-full bg-white/95 dark:bg-[#11142A]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-indigo-950/5 dark:shadow-[0_25px_80px_rgba(0,0,0,0.75)] relative overflow-hidden transition-colors duration-200">
          
          {/* Top Subtle Glowing Accent Line */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent shadow-[0_0_15px_#C084FC]" />

          {/* Tab Switcher: Raise Support Query vs Track Your Ticket */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab('submit'); setTrackError(null); }}
                className={cn(
                  'px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2',
                  activeTab === 'submit'
                    ? 'bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]'
                )}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Raise a Support Query</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab('track'); setTrackError(null); }}
                className={cn(
                  'px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2',
                  activeTab === 'track'
                    ? 'bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]'
                )}
              >
                <Search className="w-4 h-4" />
                <span>Track Your Ticket</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: RAISE SUPPORT QUERY FORM */}
          {/* ============================================================== */}
          {activeTab === 'submit' && !createdTicket && (
            <div>
              
              {/* Form Card Header */}
              <div className="text-center space-y-2.5 mb-8 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Priority Operations Desk Active</span>
                  <span>•</span>
                  <span>Live IST Support</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Raise a Support Query
                </h1>
                
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Have a technical question or issue with your LMS, Chakravyuh CRM, or WordPress setup? Fill out the details below and our technical engineers will resolve your query on priority.
                </p>
              </div>

              {/* The Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                
                {/* Row 1: Full Name & WhatsApp Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Name <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Your Full Name*"
                        className={cn(
                          'w-full h-12 rounded-2xl border px-4 text-sm font-medium transition-all shadow-inner',
                          'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                          'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                          errors.fullName 
                            ? 'border-red-500 focus:ring-red-500/25' 
                            : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                        )}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  {/* WhatsApp Mobile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Number (WhatsApp) <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        maxLength={10}
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9823012345"
                        className={cn(
                          'w-full h-12 rounded-2xl border pl-16 pr-10 text-sm font-mono font-medium transition-all shadow-inner',
                          'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                          'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                          errors.mobile 
                            ? 'border-red-500 focus:ring-red-500/25' 
                            : isMobileValid
                            ? 'border-emerald-500 focus:ring-emerald-500/25'
                            : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                        )}
                      />
                      {isMobileValid && (
                        <Check className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    {errors.mobile && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.mobile}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email Address (Gmail) & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Gmail) <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yourname@gmail.com*"
                        className={cn(
                          'w-full h-12 rounded-2xl border px-4 pr-10 text-sm font-medium transition-all shadow-inner',
                          'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                          'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                          errors.email 
                            ? 'border-red-500 focus:ring-red-500/25' 
                            : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                        )}
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      City <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Pune, Mumbai, Delhi, Nagpur*"
                        className={cn(
                          'w-full h-12 rounded-2xl border px-4 text-sm font-medium transition-all shadow-inner',
                          'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                          'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                          errors.city 
                            ? 'border-red-500 focus:ring-red-500/25' 
                            : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                        )}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Membership Tier (The 4 Options) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Membership Tier <span className="text-pink-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Selected: {formData.membershipTier}
                    </span>
                  </div>

                  {/* Dropdown */}
                  <div className="relative mb-3">
                    <select
                      name="membershipTier"
                      value={formData.membershipTier}
                      onChange={e => setFormData({ ...formData, membershipTier: e.target.value as MembershipTier })}
                      className="w-full h-12 rounded-2xl bg-slate-50/90 dark:bg-[#262A4D]/80 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white px-4 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/25 transition cursor-pointer shadow-inner"
                    >
                      <option value="Diamond Member" className="bg-white dark:bg-[#1C203E] text-slate-900 dark:text-white">💎 1. Diamond Member (Highest Priority SLA)</option>
                      <option value="Silver Member" className="bg-white dark:bg-[#1C203E] text-slate-900 dark:text-white">🥈 2. Silver Member (Standard Technical)</option>
                      <option value="Gold Member" className="bg-white dark:bg-[#1C203E] text-slate-900 dark:text-white">🥇 3. Gold Member (Priority Technical)</option>
                      <option value="PMP Member" className="bg-white dark:bg-[#1C203E] text-slate-900 dark:text-white">⭐ 4. PMP Member (Project Mentorship)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* 4 Clickable Tier Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {MEMBERSHIP_OPTIONS.map(opt => {
                      const isSelected = formData.membershipTier === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, membershipTier: opt.id })}
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all duration-150 select-none flex flex-col justify-between h-20 shadow-xs',
                            isSelected 
                              ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/25 font-bold' 
                              : 'bg-white dark:bg-[#262A4D]/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 font-medium'
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xl">{opt.icon}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold block leading-tight text-slate-900 dark:text-white">
                              {opt.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Assigned Specialist */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assign Support Specialist
                    </label>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Selected: {formData.assignedSpecialist}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Sachin Sir */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedSpecialist: 'Sachin Sir' })}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all duration-150 select-none flex flex-col justify-between shadow-xs',
                        formData.assignedSpecialist === 'Sachin Sir'
                          ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/25 font-bold'
                          : 'bg-white dark:bg-[#262A4D]/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 font-medium'
                      )}
                    >
                      <div className="flex items-start justify-between w-full mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            SS
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">
                              Sachin Sir
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Primary Technical Lead
                            </span>
                          </div>
                        </div>
                        {formData.assignedSpecialist === 'Sachin Sir' && (
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-normal leading-relaxed mb-2">
                        WordPress, Hosting, LMS, Chakravyuh CRM & all other technical operations
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 w-fit">
                        All Other Operations
                      </span>
                    </button>

                    {/* Onkar Kulkarni */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedSpecialist: 'Onkar Kulkarni' })}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all duration-150 select-none flex flex-col justify-between shadow-xs',
                        formData.assignedSpecialist === 'Onkar Kulkarni'
                          ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/25 font-bold'
                          : 'bg-white dark:bg-[#262A4D]/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 font-medium'
                      )}
                    >
                      <div className="flex items-start justify-between w-full mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            OK
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">
                              Onkar Kulkarni
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Meta Related Specialist
                            </span>
                          </div>
                        </div>
                        {formData.assignedSpecialist === 'Onkar Kulkarni' && (
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-normal leading-relaxed mb-2">
                        Exclusively for Meta Ads, Facebook & Instagram, Meta Pixel & Ad Accounts
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 w-fit">
                        Only Meta Related
                      </span>
                    </button>
                  </div>
                </div>

                {/* Row 5: Platform & Inquiry Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Platform / Ecosystem <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={formData.ecosystem}
                      onChange={e => setFormData({ ...formData, ecosystem: e.target.value as ProductEcosystem })}
                      className="w-full h-12 rounded-2xl bg-slate-50/90 dark:bg-[#262A4D]/80 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/25 transition cursor-pointer shadow-inner"
                    >
                      <option value="Chakravyuh CRM" className="bg-white dark:bg-[#1C203E]">Chakravyuh CRM (Meta / WABA / Leads)</option>
                      <option value="Digital Azadi Hub" className="bg-white dark:bg-[#1C203E]">Digital Azadi Hub (LMS / Course Portal)</option>
                      <option value="WordPress & Hosting" className="bg-white dark:bg-[#1C203E]">WordPress & Hosting (cPanel / SSL / DNS)</option>
                      <option value="Other" className="bg-white dark:bg-[#1C203E]">Other Technical Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Inquiry Subject <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. WordPress DNS & SSL Error*"
                      className={cn(
                        'w-full h-12 rounded-2xl border px-4 text-sm font-medium transition-all shadow-inner',
                        'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                        'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                        errors.subject 
                          ? 'border-red-500 focus:ring-red-500/25' 
                          : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                      )}
                    />
                    {errors.subject && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.subject}</p>
                    )}
                  </div>
                </div>

                {/* Row 6: Detailed Message / Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Write your message / Detailed Description <span className="text-pink-500">*</span>
                    </label>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Click tag to insert prefix:</span>
                    </span>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      rows={4}
                      name="description"
                      required
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Please explain the details of your issue, what happened, and any steps to reproduce so our engineers can resolve it quickly..."
                      className={cn(
                        'w-full p-4 rounded-2xl border text-sm font-medium leading-relaxed resize-none transition-all shadow-inner',
                        'bg-slate-50/90 dark:bg-[#262A4D]/80 text-slate-900 dark:text-white placeholder-slate-400',
                        'focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B]',
                        errors.description 
                          ? 'border-red-500 focus:ring-red-500/25' 
                          : 'border-slate-300 dark:border-white/15 focus:ring-purple-500/25'
                      )}
                    />
                  </div>
                  {errors.description && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.description}</p>
                  )}

                  {/* Quick Clickable Issue Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ISSUE_TAGS.map(item => (
                      <button
                        type="button"
                        key={item.tag}
                        onClick={() => handleAppendIssueTag(item.append)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition active:scale-95"
                      >
                        {item.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 7: Target Website URL (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Website <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full h-11 rounded-2xl bg-slate-50/90 dark:bg-[#262A4D]/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:border-purple-500 focus:bg-white dark:focus:bg-[#2C315B] transition shadow-inner"
                    />
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left font-medium">
                    🔒 Directly logged into the verified Digital Azadi operations queue.
                  </p>

                  {/* Gradient Pill Button (Send Message) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full sm:w-auto px-10 py-3.5 rounded-full text-base font-bold text-white shadow-xl transition-all duration-200',
                      'bg-gradient-to-r from-[#5B4DF6] via-[#943FEF] to-[#EF3899] hover:from-[#6D5DFB] hover:to-[#F54B9F]',
                      'shadow-[0_10px_30px_rgba(239,56,153,0.38)] hover:shadow-[0_14px_40px_rgba(239,56,153,0.55)]',
                      'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Query...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* ============================================================== */}
          {/* SUCCESS CONFIRMATION RECEIPT */}
          {/* ============================================================== */}
          {activeTab === 'submit' && createdTicket && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Support Query Submitted!
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Your query has been recorded in the Digital Azadi operations queue. Please save your Ticket ID below.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="rounded-3xl bg-white dark:bg-white/[0.05] backdrop-blur-xl border border-slate-200 dark:border-white/15 p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                  <div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider block">
                      OFFICIAL TICKET IDENTIFIER
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white tracking-wider block mt-1">
                      {createdTicket.ticketId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTicketId}
                    className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] border border-slate-200 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white transition flex items-center gap-1.5"
                  >
                    {hasCopiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Requester:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{createdTicket.requesterName}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 block">{createdTicket.requesterPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Assigned Specialist:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-300 text-sm">{createdTicket.assignedSpecialist}</span>
                    <span className="text-slate-500 dark:text-slate-400 block">{createdTicket.membershipTier}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Subject:</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium text-xs sm:text-sm">
                    {createdTicket.subject}
                  </p>
                </div>

                {/* WhatsApp Chat Link */}
                <a
                  href={`https://wa.me/91${createdTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, I have submitted ticket ${createdTicket.ticketId} regarding "${createdTicket.subject}". Please assist.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Helpdesk on WhatsApp</span>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTrackTicketId(createdTicket.ticketId);
                    setTrackPhone(createdTicket.requesterPhone);
                    setActiveTab('track');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Status Live</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Raise Another Query</span>
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: TRACK YOUR TICKET SECTION */}
          {/* ============================================================== */}
          {activeTab === 'track' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-300 shadow-md">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Track Your Ticket Status
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Enter your Ticket ID and registered WhatsApp number to verify and check real-time progress.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleTrackSearch} className="rounded-3xl bg-white dark:bg-white/[0.05] backdrop-blur-xl border border-slate-200 dark:border-white/15 p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ticket ID <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trackTicketId}
                      onChange={e => setTrackTicketId(e.target.value.toUpperCase())}
                      placeholder="e.g. DA-2026-8941"
                      className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-[#262A4D]/80 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono uppercase px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/25 transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered WhatsApp Number <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-Digit Mobile Number"
                      className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-[#262A4D]/80 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/25 transition shadow-inner"
                    />
                  </div>
                </div>

                {trackError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{trackError}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSearchingTrack}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#5B4DF6] via-[#943FEF] to-[#EF3899] text-white text-sm font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearchingTrack ? 'Verifying...' : 'Check Status'}</span>
                  </button>
                </div>
              </form>

              {/* Track Result Card */}
              {trackedTicket && (
                <div className="rounded-3xl bg-white dark:bg-white/[0.05] backdrop-blur-xl border border-slate-200 dark:border-white/15 p-6 sm:p-8 space-y-4 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider block">
                        TICKET STATUS
                      </span>
                      <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                        {trackedTicket.ticketId}
                      </span>
                    </div>
                    <Badge variant="status" value={trackedTicket.status} size="md" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Requester:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{trackedTicket.requesterName}</span>
                      <span className="text-slate-500 dark:text-slate-400 block">{trackedTicket.city || 'India'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Assigned Specialist:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-300 text-sm">{trackedTicket.assignedSpecialist}</span>
                      <span className="text-slate-500 dark:text-slate-400 block">{trackedTicket.membershipTier}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Subject:</span>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium text-xs sm:text-sm">
                      {trackedTicket.subject}
                    </p>
                  </div>

                  {trackedTicket.resolutionNotes && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                      <span className="font-bold block mb-1">Resolution Summary:</span>
                      <p>{trackedTicket.resolutionNotes}</p>
                    </div>
                  )}

                  <a
                    href={`https://wa.me/91${trackedTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, checking on my ticket ${trackedTicket.ticketId} (${trackedTicket.subject}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* Clean Minimalist Bottom Copyright */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 Digital Azadi Support. Student & Franchise Resolution Center • Asia/Kolkata (IST)</p>
      </footer>

    </div>
  );
};
