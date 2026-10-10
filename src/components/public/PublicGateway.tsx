import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TicketFormData, 
  UserType, 
  MembershipTier, 
  ProductEcosystem, 
  Ticket 
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
  ShieldCheck, 
  AlertCircle,
  MapPin,
  Award,
  Building2,
  GraduationCap,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Shield,
  Zap
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
    id: 'Gold Member', 
    label: 'Gold Member', 
    badge: 'Gold Tier', 
    icon: '🥇',
    desc: 'Priority queue with fast technical turnaround' 
  },
  { 
    id: 'Silver Member', 
    label: 'Silver Member', 
    badge: 'Silver Tier', 
    icon: '🥈',
    desc: 'Standard technical query and setup assistance' 
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
      // Scroll to first error
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
          colors: ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6'],
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
    } finally {
      setIsSearchingTrack(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-text-pure flex flex-col selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="h-20 sm:h-22 border-b border-surface-border bg-surface/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        
        {/* Brand: Official Digital Azadi Logo & Title */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <BrandLogo size="md" showBadge={false} />
          <div className="hidden sm:block">
            <span className="text-base sm:text-lg font-bold text-text-pure tracking-tight block leading-tight">
              Digital Azadi Support
            </span>
            <p className="text-xs text-text-muted font-medium">
              Student & Franchise Resolution Center
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle & Live IST Clock */}
        <div className="flex items-center gap-3">
          <ThemeToggle showLabel />
          <div className="hidden xs:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs shadow-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-text-pure font-mono text-xs">{istTime}</span>
            <span className="text-[11px] text-text-muted font-semibold uppercase">IST</span>
          </div>
        </div>

      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Portal Navigation Pills (Submit vs Track) */}
        {!createdTicket && (
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="inline-flex p-1.5 rounded-2xl bg-surface border border-surface-border shadow-sm">
              <button
                type="button"
                onClick={() => { setActiveTab('submit'); setTrackError(null); }}
                className={cn(
                  'px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 sm:gap-2.5 transition-all duration-150',
                  activeTab === 'submit'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-text-soft hover:text-text-pure hover:bg-surface-elevated'
                )}
              >
                <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span>Raise Support Query</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab('track'); setTrackError(null); }}
                className={cn(
                  'px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 sm:gap-2.5 transition-all duration-150',
                  activeTab === 'track'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-text-soft hover:text-text-pure hover:bg-surface-elevated'
                )}
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span>Track Your Ticket</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: RAISE SUPPORT QUERY FORM */}
        {activeTab === 'submit' && (
          <>
            {!createdTicket ? (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* Hero Headline & Purpose */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-surface-border text-xs text-text-muted shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-text-pure font-bold">Priority Operations Desk</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Live Support in IST</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-text-pure tracking-tight leading-tight">
                    Raise a Support Query
                  </h1>
                  
                  <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                    Have a technical question or issue with your LMS, Chakravyuh CRM, or WordPress setup? Fill out the form below and our technical engineers will resolve your query on priority.
                  </p>
                </div>

                {/* Main Form Container Card */}
                <form 
                  onSubmit={handleSubmit} 
                  noValidate
                  className="bg-surface border border-surface-border rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden"
                >
                  
                  {/* Subtle top ambient accent line */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                  {/* ============================================================== */}
                  {/* SECTION 1: Personal & Contact Information */}
                  {/* ============================================================== */}
                  <div className="space-y-6">
                    
                    <div className="flex items-center gap-3.5 pb-3 border-b border-surface-border">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 shadow-xs">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                          1. Your Contact Information
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                          Provide your registered name, WhatsApp number, Gmail, and city for priority resolution.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="e.g. Ramesh Kulkarni"
                            className={cn(
                              'w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border pl-12 pr-4 text-base font-medium',
                              'transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-xs',
                              errors.fullName 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                            )}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errors.fullName}</span>
                          </p>
                        )}
                      </div>

                      {/* Contact Number (WhatsApp) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                            Contact Number (WhatsApp) <span className="text-red-500">*</span>
                          </label>
                          {isMobileValid && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                              <span>Valid Mobile</span>
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 font-bold font-mono pointer-events-none select-none">
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
                              'w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border pl-20 pr-4 text-base font-mono font-medium',
                              'transition-all duration-150 focus:outline-none focus:ring-2 shadow-xs',
                              errors.mobile 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : isMobileValid
                                ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                            )}
                          />
                        </div>
                        {errors.mobile ? (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errors.mobile}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                            Direct updates and WhatsApp resolution will be sent to this number.
                          </p>
                        )}
                      </div>

                      {/* Email Address (Gmail) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                            Email Address (Gmail) <span className="text-red-500">*</span>
                          </label>
                          {isGmail && (
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                              Gmail Verified
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="yourname@gmail.com"
                            className={cn(
                              'w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border pl-12 pr-4 text-base font-medium',
                              'transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-xs',
                              errors.email 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                            )}
                          />
                        </div>
                        {errors.email ? (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errors.email}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                            Used for email receipts and Google Meet screen share requests.
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Pune, Mumbai, Delhi, Nagpur"
                            className={cn(
                              'w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border pl-12 pr-4 text-base font-medium',
                              'transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-xs',
                              errors.city 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                            )}
                          />
                        </div>
                        {errors.city && (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errors.city}</span>
                          </p>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* ============================================================== */}
                  {/* SECTION 2: Membership Tier & Category */}
                  {/* ============================================================== */}
                  <div className="space-y-6 pt-3">
                    
                    <div className="flex items-center gap-3.5 pb-3 border-b border-surface-border">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0 shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                          2. Classification & Membership
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                          Choose your exact membership tier (Diamond, Silver, Gold, or PMP) and category.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Membership Tier */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <label className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                            Membership Tier <span className="text-red-500">*</span>
                          </label>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            Selected: {formData.membershipTier}
                          </span>
                        </div>

                        {/* Dropdown for Accessibility */}
                        <div className="relative mb-3">
                          <select
                            name="membershipTier"
                            value={formData.membershipTier}
                            onChange={e => setFormData({ ...formData, membershipTier: e.target.value as MembershipTier })}
                            className="w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-base font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition cursor-pointer shadow-xs"
                          >
                            <option value="Diamond Member">💎 1. Diamond Member</option>
                            <option value="Silver Member">🥈 2. Silver Member</option>
                            <option value="Gold Member">🥇 3. Gold Member</option>
                            <option value="PMP Member">⭐ 4. PMP Member</option>
                          </select>
                        </div>

                        {/* Prominent 4 Tier Cards for 1-Click Selection */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {MEMBERSHIP_OPTIONS.map(opt => {
                            const isSelected = formData.membershipTier === opt.id;
                            return (
                              <button
                                type="button"
                                key={opt.id}
                                onClick={() => setFormData({ ...formData, membershipTier: opt.id })}
                                className={cn(
                                  'p-3.5 rounded-2xl border text-left transition-all duration-150 select-none flex flex-col justify-between h-24 shadow-xs',
                                  isSelected 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20 font-bold' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                                )}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-2xl">{opt.icon}</span>
                                  {isSelected && (
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-sm sm:text-base font-bold block leading-tight text-slate-900 dark:text-white">
                                    {opt.label}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                                    {opt.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* User Category (Student Pro vs Franchise Hub) */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2.5">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {[
                            { 
                              id: 'Student Pro' as UserType, 
                              icon: GraduationCap, 
                              title: 'Student Pro',
                              desc: 'Enrolled in Digital Azadi Courses' 
                            },
                            { 
                              id: 'Franchise Hub' as UserType, 
                              icon: Building2, 
                              title: 'Franchise Hub',
                              desc: 'Authorized Franchise Partner' 
                            },
                          ].map(item => {
                            const isSelected = formData.userType === item.id;
                            const Icon = item.icon;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => setFormData({ ...formData, userType: item.id })}
                                className={cn(
                                  'p-4 rounded-2xl border text-left transition-all duration-150 select-none flex items-center justify-between shadow-xs',
                                  isSelected 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20 font-bold' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                                )}
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-base font-bold block text-slate-900 dark:text-white">{item.title}</span>
                                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block">{item.desc}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* ============================================================== */}
                  {/* SECTION 3: Technical Inquiry Specifications */}
                  {/* ============================================================== */}
                  <div className="space-y-6 pt-3">
                    
                    <div className="flex items-center gap-3.5 pb-3 border-b border-surface-border">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                          3. Issue Details
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                          Provide detailed context regarding your setup, issue, or question.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      
                      {/* Platform / Ecosystem */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Platform / Ecosystem <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.ecosystem}
                          onChange={e => setFormData({ ...formData, ecosystem: e.target.value as ProductEcosystem })}
                          className="w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-base font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition cursor-pointer shadow-xs"
                        >
                          <option value="Chakravyuh CRM">Chakravyuh CRM (Meta / WABA / Leads)</option>
                          <option value="Digital Azadi Hub">Digital Azadi Hub (LMS / Course Portal)</option>
                          <option value="WordPress & Hosting">WordPress & Hosting (cPanel / SSL / DNS)</option>
                          <option value="Other">Other Technical Inquiries</option>
                        </select>
                      </div>

                      {/* Issue Category */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Issue Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-base font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition cursor-pointer shadow-xs"
                        >
                          <option value="CRM & Lead Management">CRM & Lead Management</option>
                          <option value="LMS & Course Access">LMS & Course Access</option>
                          <option value="Domain & Hosting">Domain, Hosting & DNS</option>
                          <option value="Membership & Tier">Membership & Tier Upgrades</option>
                          <option value="Account & Permissions">Account & Permissions</option>
                          <option value="Billing & Invoicing">Billing & Invoicing</option>
                          <option value="General Technical Support">General Technical Support</option>
                        </select>
                      </div>

                    </div>

                    {/* Inquiry Subject */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Inquiry Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. WhatsApp WABA webhook integration failing on port 443"
                        className={cn(
                          'w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border px-4 text-base font-medium',
                          'transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-xs',
                          errors.subject 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                        )}
                      />
                      {errors.subject && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errors.subject}</span>
                        </p>
                      )}
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                          Detailed Description <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-bold">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Click chip to auto-insert prefix:</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pb-1">
                        {ISSUE_TAGS.map(item => (
                          <button
                            type="button"
                            key={item.tag}
                            onClick={() => handleAppendIssueTag(item.append)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold transition active:scale-95 shadow-xs"
                          >
                            {item.tag}
                          </button>
                        ))}
                      </div>

                      {/* Textarea */}
                      <textarea
                        rows={5}
                        name="description"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Please explain the details of your issue, what happened, and any steps to reproduce so our engineers can resolve it quickly..."
                        className={cn(
                          'w-full p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border text-base font-medium leading-relaxed resize-none',
                          'transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-xs',
                          errors.description 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600/20'
                        )}
                      />
                      {errors.description && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errors.description}</span>
                        </p>
                      )}
                    </div>

                    {/* Target Website URL (Optional) */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Target Website URL <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="url"
                          value={formData.websiteUrl}
                          onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                          placeholder="https://yourwebsite.com"
                          className="w-full h-13 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 pl-12 pr-4 text-base font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Submission Action Bar */}
                  <div className="pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left font-medium">
                      🔒 Your query is logged directly into the Digital Azadi operations database.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        'w-full sm:w-auto h-14 px-10 py-3.5 rounded-2xl text-base font-bold text-white shadow-lg transition-all',
                        'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none',
                        'flex items-center justify-center gap-2.5 shadow-indigo-600/25'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Support Query...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Submit Support Query</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

                {/* Trust & Guarantee Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-pure">Secure & Confidential</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">Encrypted logging directly into Digital Azadi database.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-pure">Direct to Engineers</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">No bot loops. Handled by verified technical support staff.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-pure">Live IST Tracking</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">Real-time stopwatch sessions and WhatsApp updates.</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ============================================================== */
              /* SUCCESS STATE / DIGITAL TICKET CONFIRMATION RECEIPT */
              /* ============================================================== */
              <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
                
                {/* Header Callout */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text-pure tracking-tight">
                    Support Query Submitted Successfully!
                  </h2>
                  <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto">
                    Your inquiry has been registered in the Digital Azadi Operations Queue. Please save your Ticket ID below.
                  </p>
                </div>

                {/* Digital Ticket Pass Card */}
                <div className="bg-surface border border-surface-border rounded-3xl overflow-hidden shadow-xl">
                  
                  <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600" />

                  {/* Ticket Header */}
                  <div className="p-6 sm:p-8 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-elevated/40">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        OFFICIAL TICKET IDENTIFIER
                      </span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-2xl sm:text-3xl font-mono font-extrabold text-text-pure tracking-wider">
                          {createdTicket.ticketId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTicketId}
                          className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-xs font-semibold text-text-pure transition flex items-center gap-1.5"
                          title="Copy Ticket ID"
                        >
                          {hasCopiedId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                        Logged in Queue
                      </span>
                      <span className="block text-xs font-semibold text-text-muted mt-1.5">
                        {createdTicket.membershipTier}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Body Summary */}
                  <div className="p-6 sm:p-8 space-y-5 text-sm">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                      <div>
                        <span className="text-text-muted text-xs font-medium block">Requester Name</span>
                        <span className="text-text-pure font-bold text-base">{createdTicket.requesterName}</span>
                        <span className="text-text-muted font-mono text-xs block mt-0.5">{createdTicket.requesterPhone}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs font-medium block">Location / City</span>
                        <span className="text-text-pure font-semibold text-base">{createdTicket.city || 'Not specified'}</span>
                        <span className="text-text-muted text-xs block mt-0.5">{createdTicket.requesterEmail}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                      <div>
                        <span className="text-text-muted text-xs font-medium block">Platform & Category</span>
                        <span className="text-text-pure font-semibold">{createdTicket.ecosystem}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs block font-medium mt-0.5">{createdTicket.category}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs font-medium block">Submission Time (IST)</span>
                        <span className="text-text-pure font-mono text-xs font-semibold">{formatToISTDateTimeString(createdTicket.createdAt)}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 text-xs font-medium block mt-0.5">Assigned to Technical Queue</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-muted text-xs font-medium block mb-1.5">Subject</span>
                      <p className="text-text-pure font-semibold bg-surface-elevated p-3.5 rounded-xl border border-surface-border leading-relaxed">
                        {createdTicket.subject}
                      </p>
                    </div>

                  </div>

                  {/* WhatsApp Follow-up Banner */}
                  <div className="bg-surface-elevated p-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <span className="text-sm font-bold text-text-pure block">
                        Need an immediate update or have urgent queries?
                      </span>
                      <p className="text-xs text-text-muted mt-0.5">
                        Connect directly with our support helpdesk on WhatsApp.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/91${createdTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, I have submitted ticket ${createdTicket.ticketId} regarding "${createdTicket.subject}". Please assist.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all shrink-0"
                    >
                      <MessageCircle className="w-4.5 h-4.5" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackTicketId(createdTicket.ticketId);
                      setTrackPhone(createdTicket.requesterPhone);
                      setActiveTab('track');
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>Track Ticket Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-sm font-semibold text-text-pure transition inline-flex items-center justify-center gap-2 shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Raise Another Support Query</span>
                  </button>
                </div>

              </div>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TRACK YOUR TICKET SECTION */}
        {/* ============================================================== */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Search className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-extrabold text-text-pure tracking-tight">
                Track Your Ticket Status
              </h1>
              <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto leading-relaxed">
                Enter your Ticket ID and your registered 10-digit mobile number to check real-time progress and updates.
              </p>
            </div>

            {/* Tracking Search Card */}
            <form onSubmit={handleTrackSearch} className="bg-surface border border-surface-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-pure mb-2">
                    Ticket ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trackTicketId}
                    onChange={e => setTrackTicketId(e.target.value.toUpperCase())}
                    placeholder="e.g. DA-2026-8941"
                    className="w-full h-12 bg-surface-elevated text-text-pure font-mono font-semibold rounded-xl border border-surface-border px-4 text-sm sm:text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none uppercase placeholder:normal-case placeholder:text-text-faint transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-pure mb-2">
                    Registered WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-sm text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold pointer-events-none select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9823012345"
                      className="w-full h-12 bg-surface-elevated text-text-pure font-mono font-semibold rounded-xl border border-surface-border pl-19 pr-4 text-sm sm:text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none placeholder:text-text-faint transition"
                    />
                  </div>
                </div>
              </div>

              {trackError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-800 text-xs sm:text-sm text-red-700 dark:text-red-400 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium">{trackError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSearchingTrack}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearchingTrack ? 'Verifying Records...' : 'Check Status'}</span>
                </button>
              </div>

            </form>

            {/* TRACKED TICKET RESULT CARD */}
            {trackedTicket && (
              <div className="bg-surface border border-surface-border rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-200">
                <div className="h-2 w-full bg-indigo-600" />

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-surface-border flex items-start justify-between gap-4 bg-surface-elevated/40">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      TICKET DOSSIER
                    </span>
                    <div className="text-2xl font-mono font-extrabold text-text-pure mt-1">
                      {trackedTicket.ticketId}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="status" value={trackedTicket.status} size="md" />
                    <span className="block text-xs font-semibold text-text-muted mt-1.5">
                      {trackedTicket.membershipTier}
                    </span>
                  </div>
                </div>

                {/* Status Guidance Banner */}
                <div className="p-4 sm:p-5 border-b border-surface-border bg-indigo-50/50 dark:bg-indigo-950/20 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 font-semibold text-indigo-900 dark:text-indigo-200">
                    <Clock className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {trackedTicket.status === 'Resolved'
                        ? '✅ This support inquiry has been resolved.'
                        : trackedTicket.status === 'In Progress'
                        ? '⚡ An engineer is actively resolving this support session.'
                        : trackedTicket.status === 'Waiting for User'
                        ? '💬 Action required: Our support team has requested information from you.'
                        : '📋 Ticket is safely logged in queue and awaiting specialist assignment.'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 sm:p-8 space-y-5 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                    <div>
                      <span className="text-text-muted text-xs font-medium block">Requester Name</span>
                      <span className="text-text-pure font-bold text-base">{trackedTicket.requesterName}</span>
                      {trackedTicket.city && (
                        <span className="text-text-muted text-xs block font-medium mt-0.5">City: {trackedTicket.city}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-text-muted text-xs font-medium block">Platform</span>
                      <span className="text-text-pure font-semibold text-base">{trackedTicket.ecosystem}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold block mt-0.5">{trackedTicket.category}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                    <div>
                      <span className="text-text-muted text-xs font-medium block">Submitted Date (IST)</span>
                      <span className="text-text-pure font-mono text-xs font-semibold">{formatToISTDateTimeString(trackedTicket.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-xs font-medium block">Last Updated (IST)</span>
                      <span className="text-text-pure font-mono text-xs font-semibold">{formatToISTDateTimeString(trackedTicket.updatedAt)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-text-muted text-xs font-medium block mb-1.5">Subject</span>
                    <p className="text-text-pure font-semibold bg-surface-elevated p-3.5 rounded-xl border border-surface-border leading-relaxed">
                      {trackedTicket.subject}
                    </p>
                  </div>

                  {/* Public Resolution Notes if resolved */}
                  {trackedTicket.resolutionNotes && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        Resolution Summary:
                      </span>
                      <p className="text-xs sm:text-sm text-text-pure leading-relaxed">
                        {trackedTicket.resolutionNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 sm:p-6 bg-surface-elevated border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm text-text-muted font-medium text-center sm:text-left">
                    Have additional questions regarding this ticket?
                  </span>
                  <a
                    href={`https://wa.me/91${trackedTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, checking on my ticket ${trackedTicket.ticketId} (${trackedTicket.subject}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Trust Footer */}
      <footer className="border-t border-surface-border py-8 px-4 text-center text-xs sm:text-sm text-text-muted bg-surface/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <BrandLogo size="sm" showBadge={false} />
            <span>Digital Azadi Support Center</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Timezone: Asia/Kolkata (IST)</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cloud Synced</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
