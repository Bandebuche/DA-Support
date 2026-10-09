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
  AlertCircle
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
    userType: 'Student Pro',
    membershipTier: 'Diamond Elite',
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

  // WhatsApp Validation
  const mobileDigits = formData.mobile.replace(/\D/g, '');
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileDigits);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters).';
    }
    if (!isMobileValid) {
      errs.mobile = 'Enter a valid 10-digit Indian WhatsApp mobile number (starting with 6-9).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 4) {
      errs.subject = 'Please enter a subject (at least 4 characters).';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please describe your query in detail (minimum 10 characters).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const ticket = await ticketService.submitTicket({
        ...formData,
        mobile: formData.mobile.replace(/\D/g, ''),
      });

      setCreatedTicket(ticket);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#FF5500', '#A5B4FC'],
        });
      } catch (e) {
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
      userType: 'Student Pro',
      membershipTier: 'Diamond Elite',
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
        // Check if ID exists but phone doesn't match for security
        const idExists = allTickets.some(t => t.ticketId.toUpperCase() === cleanId);
        if (idExists) {
          setTrackError('Ticket ID found, but the mobile number does not match our records for this ticket. Please verify your 10-digit registered number.');
        } else {
          setTrackError(`No record found for Ticket ID "${cleanId}". Please verify your ticket number or submit a new inquiry.`);
        }
      }
    } finally {
      setIsSearchingTrack(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-text-pure flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Clean Top Header (Public Branding ONLY) */}
      <header className="h-20 border-b border-surface-border bg-surface/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        
        {/* Brand: Official Digital Azadi Logo */}
        <div className="flex items-center gap-3.5">
          <BrandLogo size="md" showBadge={false} />
          <div className="hidden sm:block">
            <span className="text-base font-bold text-text-pure tracking-tight block">
              Digital Azadi Support
            </span>
            <p className="text-xs text-text-muted">
              Student & Franchise Resolution Portal
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle & Live IST Clock */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle showLabel />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-xs shadow-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-text-pure font-mono">{istTime}</span>
            <span className="text-[10px] text-text-muted">IST</span>
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-10">
        
        {/* Portal Mode Switcher Pills (Submit New Ticket vs Track Ticket) */}
        {!createdTicket && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-2xl bg-surface border border-surface-border shadow-sm">
              <button
                onClick={() => { setActiveTab('submit'); setTrackError(null); }}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
                  activeTab === 'submit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-text-soft hover:text-text-pure hover:bg-surface-elevated'
                )}
              >
                <FileText className="w-4 h-4" />
                <span>Submit Support Ticket</span>
              </button>
              <button
                onClick={() => { setActiveTab('track'); setTrackError(null); }}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
                  activeTab === 'track'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-text-soft hover:text-text-pure hover:bg-surface-elevated'
                )}
              >
                <Search className="w-4 h-4" />
                <span>Track Your Ticket</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: SUBMIT TICKET FORM */}
        {activeTab === 'submit' && (
          <>
            {!createdTicket ? (
              <div className="space-y-6">
                
                {/* Hero Banner */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface border border-surface-border text-xs text-text-muted shadow-sm">
                    <span className="text-amber-500 font-bold">⚡</span>
                    <span className="text-text-pure font-semibold">Digital Azadi Priority Desk</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Guaranteed IST Response</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-text-pure tracking-tight">
                    Raise a Support Inquiry
                  </h1>
                  <p className="text-xs md:text-sm text-text-muted max-w-lg mx-auto">
                    Fill in your details below and our technical support team will assist you on priority.
                  </p>
                </div>

                {/* Support Form */}
                <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                  
                  {/* SECTION 1: Contact Details */}
                  <div className="space-y-4">
                    <div className="border-b border-surface-border pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        1. Your Contact Information
                      </h2>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Ramesh Kulkarni"
                          className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint transition"
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* WhatsApp Mobile */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-text-muted">
                            WhatsApp Mobile <span className="text-red-500">*</span>
                          </label>
                          {isMobileValid && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              Valid 10-Digit Mobile
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="text-xs text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                            placeholder="9823012345"
                            className={cn(
                              'w-full bg-surface-elevated text-text-pure rounded-xl border pl-12 pr-4 py-2.5 text-xs font-mono focus:outline-none transition',
                              isMobileValid ? 'border-emerald-400 focus:border-emerald-500' : 'border-surface-border focus:border-indigo-500'
                            )}
                          />
                        </div>
                        {errors.mobile && <p className="text-xs text-red-500 mt-1 font-medium">{errors.mobile}</p>}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="ramesh@digitalazadi.com"
                            className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint transition"
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: User Category & Membership Selection */}
                  <div className="space-y-4">
                    <div className="border-b border-surface-border pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        2. Classification & Membership
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* User Type */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-2">
                          Category
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { id: 'Student Pro' as UserType, icon: '👨‍🎓', title: 'Student' },
                            { id: 'Franchise Hub' as UserType, icon: '🏢', title: 'Franchise' },
                          ].map(item => {
                            const isSelected = formData.userType === item.id;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => setFormData({ ...formData, userType: item.id })}
                                className={cn(
                                  'p-3 rounded-xl border cursor-pointer transition select-none flex items-center justify-between text-left',
                                  isSelected 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'bg-surface-elevated border-surface-border text-text-pure hover:border-surface-hover font-medium'
                                )}
                              >
                                <span className="text-xs flex items-center gap-1.5">
                                  <span>{item.icon}</span>
                                  <span>{item.title}</span>
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Membership Tier */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-2">
                          Membership Tier
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'Diamond Elite' as MembershipTier, title: 'Diamond' },
                            { id: 'Silver Pass' as MembershipTier, title: 'Silver' },
                            { id: 'Other / Not Specified' as MembershipTier, title: 'Other' },
                          ].map(item => {
                            const isSelected = formData.membershipTier === item.id;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => setFormData({ ...formData, membershipTier: item.id })}
                                className={cn(
                                  'p-3 rounded-xl border cursor-pointer transition select-none text-center',
                                  isSelected 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'bg-surface-elevated border-surface-border text-text-pure hover:border-surface-hover font-medium'
                                )}
                              >
                                <span className="text-xs block truncate">
                                  {item.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Technical Inquiry Specifications */}
                  <div className="space-y-4">
                    <div className="border-b border-surface-border pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        3. Issue Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Ecosystem */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">
                          Platform / Ecosystem <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.ecosystem}
                          onChange={e => setFormData({ ...formData, ecosystem: e.target.value as ProductEcosystem })}
                          className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="Chakravyuh CRM">Chakravyuh CRM</option>
                          <option value="Digital Azadi Hub">Digital Azadi Hub</option>
                          <option value="WordPress & Hosting">WordPress & Hosting</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">
                          Issue Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="CRM & Lead Management">CRM & Lead Management</option>
                          <option value="LMS & Course Access">LMS & Course Access</option>
                          <option value="Domain & Hosting">Domain & Hosting</option>
                          <option value="Membership & Tier">Membership & Tier</option>
                          <option value="Account & Permissions">Account & Permissions</option>
                          <option value="Billing & Invoicing">Billing & Invoicing</option>
                          <option value="General Technical Support">General Technical Support</option>
                        </select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">
                        Inquiry Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary of what you need help with..."
                        className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint transition"
                      />
                      {errors.subject && <p className="text-xs text-red-500 mt-1 font-medium">{errors.subject}</p>}
                    </div>

                    {/* Issue Tags & Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-text-muted">
                          Detailed Description <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                          <Tag className="w-3 h-3" />
                          Click to insert context:
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pb-1">
                        {ISSUE_TAGS.map(item => (
                          <button
                            type="button"
                            key={item.tag}
                            onClick={() => handleAppendIssueTag(item.append)}
                            className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs text-text-soft hover:text-text-pure transition font-medium"
                          >
                            {item.tag}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Please explain the details of your issue, what happened, and any steps to reproduce..."
                        className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border p-3.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint resize-none leading-relaxed transition"
                      />
                      {errors.description && <p className="text-xs text-red-500 mt-1 font-medium">{errors.description}</p>}
                    </div>

                    {/* Target Website URL */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">
                        Target Website / URL <span className="text-text-faint">(optional)</span>
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.websiteUrl}
                          onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                          placeholder="https://yourwebsite.com"
                          className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2 border-t border-surface-border flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {isSubmitting ? (
                        <span>Submitting Ticket...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Support Ticket</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            ) : (
              /* CONFIRMATION STATE / DIGITAL TICKET RECEIPT */
              <div className="max-w-xl mx-auto space-y-6">
                
                {/* Header Callout */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-pure tracking-tight">
                    Ticket Submitted Successfully
                  </h2>
                  <p className="text-xs text-text-muted">
                    Your request has been logged. Keep your Ticket ID safe for tracking.
                  </p>
                </div>

                {/* Ticket Receipt Card */}
                <div className="bg-surface border border-surface-border rounded-3xl overflow-hidden shadow-sm">
                  
                  <div className="h-1 w-full bg-indigo-600" />

                  {/* Header */}
                  <div className="p-6 border-b border-surface-border flex items-start justify-between bg-surface-elevated/40">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        SUPPORT TICKET RECEIPT
                      </span>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <span className="text-2xl font-mono font-bold text-text-pure tracking-wider">
                          {createdTicket.ticketId}
                        </span>
                        <button
                          onClick={handleCopyTicketId}
                          className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-text-muted hover:text-text-pure transition"
                          title="Copy Ticket ID"
                        >
                          {hasCopiedId ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                        Logged in Queue
                      </span>
                      <span className="block text-xs text-text-muted mt-1 font-medium">
                        {createdTicket.membershipTier}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                      <div>
                        <span className="text-text-muted text-[11px] font-medium block">Requester</span>
                        <span className="text-text-pure font-bold text-sm">{createdTicket.requesterName}</span>
                        <span className="text-text-muted font-mono text-xs block">{createdTicket.requesterPhone}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-[11px] font-medium block">Platform & Issue</span>
                        <span className="text-text-pure font-semibold">{createdTicket.ecosystem}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs block truncate">{createdTicket.category}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                      <div>
                        <span className="text-text-muted text-[11px] font-medium block">Submitted At (IST)</span>
                        <span className="text-text-pure font-mono">{formatToISTDateTimeString(createdTicket.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted text-[11px] font-medium block">Status</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Under Support Review
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-muted text-[11px] font-medium block mb-1">Subject</span>
                      <p className="text-text-pure font-medium bg-surface-elevated p-3 rounded-xl border border-surface-border">
                        {createdTicket.subject}
                      </p>
                    </div>
                  </div>

                  {/* Direct WhatsApp Follow-up */}
                  <div className="bg-surface-elevated p-5 border-t border-surface-border flex items-center justify-between gap-3">
                    <div className="text-xs text-text-muted font-medium">
                      Need instant update? Ping on WhatsApp:
                    </div>

                    <a
                      href={`https://wa.me/919823012345?text=${encodeURIComponent(`Hello Digital Azadi Support, I have submitted ticket ${createdTicket.ticketId} regarding "${createdTicket.subject}". Please assist.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Ping Support</span>
                    </a>
                  </div>

                </div>

                {/* Reset / Submit Another Ticket */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-xs font-semibold text-text-pure transition inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Submit Another Support Ticket</span>
                  </button>
                </div>

              </div>
            )}
          </>
        )}

        {/* TAB 2: TRACK YOUR TICKET SECTION */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Search className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-text-pure tracking-tight">
                Track Your Ticket Status
              </h1>
              <p className="text-xs md:text-sm text-text-muted max-w-md mx-auto">
                Enter your Ticket ID and your registered 10-digit mobile number to check real-time progress.
              </p>
            </div>

            {/* Tracking Search Card */}
            <form onSubmit={handleTrackSearch} className="bg-surface border border-surface-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Ticket ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackTicketId}
                    onChange={e => setTrackTicketId(e.target.value.toUpperCase())}
                    placeholder="e.g. DA-2026-8941"
                    className="w-full bg-surface-elevated text-text-pure font-mono rounded-xl border border-surface-border px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none uppercase placeholder:normal-case placeholder:text-text-faint"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Registered WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9823012345"
                      className="w-full bg-surface-elevated text-text-pure font-mono rounded-xl border border-surface-border pl-12 pr-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint"
                    />
                  </div>
                </div>
              </div>

              {trackError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{trackError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSearchingTrack}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearchingTrack ? 'Verifying...' : 'Check Status'}</span>
                </button>
              </div>
            </form>

            {/* TRACKED TICKET RESULT CARD */}
            {trackedTicket && (
              <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm space-y-0">
                <div className="h-1.5 w-full bg-indigo-600" />

                {/* Header */}
                <div className="p-5 border-b border-surface-border flex items-start justify-between bg-surface-elevated/40">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      TICKET STATUS
                    </span>
                    <div className="text-xl font-mono font-bold text-text-pure mt-1">
                      {trackedTicket.ticketId}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="status" value={trackedTicket.status} size="md" />
                    <span className="block text-xs text-text-muted mt-1 font-medium">
                      {trackedTicket.membershipTier}
                    </span>
                  </div>
                </div>

                {/* Status Progress Guidance */}
                <div className="p-5 border-b border-surface-border bg-indigo-50/50 dark:bg-indigo-950/20 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {trackedTicket.status === 'Resolved'
                        ? '✅ This ticket has been resolved.'
                        : trackedTicket.status === 'In Progress'
                        ? '⚡ A support engineer is currently actively working on your issue.'
                        : trackedTicket.status === 'Waiting for User'
                        ? '💬 Our team has requested information from you.'
                        : '📋 Your ticket is safely logged in queue and awaiting assignment.'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                    <div>
                      <span className="text-text-muted text-[11px] font-medium block">Requester Name</span>
                      <span className="text-text-pure font-bold">{trackedTicket.requesterName}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px] font-medium block">Platform</span>
                      <span className="text-text-pure font-semibold">{trackedTicket.ecosystem}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs block">{trackedTicket.category}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                    <div>
                      <span className="text-text-muted text-[11px] font-medium block">Submitted Date (IST)</span>
                      <span className="text-text-pure font-mono">{formatToISTDateTimeString(trackedTicket.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px] font-medium block">Last Updated (IST)</span>
                      <span className="text-text-pure font-mono">{formatToISTDateTimeString(trackedTicket.updatedAt)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-text-muted text-[11px] font-medium block mb-1">Subject</span>
                    <p className="text-text-pure font-medium bg-surface-elevated p-3 rounded-xl border border-surface-border">
                      {trackedTicket.subject}
                    </p>
                  </div>

                  {/* Public Resolution Notes if resolved */}
                  {trackedTicket.resolutionNotes && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        Resolution Summary:
                      </span>
                      <p className="text-xs text-text-pure leading-relaxed">
                        {trackedTicket.resolutionNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-surface-elevated border-t border-surface-border flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted font-medium">
                    Have more questions?
                  </span>
                  <a
                    href={`https://wa.me/919823012345?text=${encodeURIComponent(`Hello Digital Azadi Support, checking on my ticket ${trackedTicket.ticketId} (${trackedTicket.subject}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 px-4 text-center text-xs text-text-muted">
        <p>Digital Azadi Support • Asia/Kolkata (IST)</p>
      </footer>

    </div>
  );
};
